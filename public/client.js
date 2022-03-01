// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html
console.log('trello web reports started');

window.TrelloPowerUp.initialize(
  {
    'card-badges': function(t, opts) {
      return t.card('all').then(function(card){
        //console.log(card);
        if(card && card.customFieldItems) {
          var allDate;
          var listDate;
          for (let index = 0; index < card.customFieldItems.length; index++) {
              var field = card.customFieldItems[index];
              if(field.idCustomField === "620ea17bc671633d435c9c8f" || field.idCustomField === "620ba55759d9fd4f40585b6b")
                allDate = field.value;
              if(field.idCustomField === "620ea19d65070d0323088724" || field.idCustomField === "620e53701b332d5d922fdc30")
                listDate = field.value;
          }
          var lagDays = (date2) => {
            return Math.ceil(Math.abs(date2.getTime() - Date.now()) / (1000 * 3600 * 24))
          }
          var getColor = (days) => {
            if(days > 15)
              return 'red';
            if(days < 5)
              return 'green';
            return 'yellow';
          }
          
          var newbages = [];
          var daysLagAll = allDate && lagDays(new Date(allDate.date));
          if(daysLagAll && daysLagAll > 5) {
            newbages.push({
              text: daysLagAll,
              icon: "./images/date.svg",
              color: getColor(daysLagAll),          
            });
          }
          var daysLagList = listDate && lagDays(new Date(listDate.date));
          if(daysLagList && daysLagList > 3) {
            newbages.push({
              text: "List: " + daysLagList,
              color: getColor(daysLagList),
            })
          }
        }
        return newbages
      });
    }
  });