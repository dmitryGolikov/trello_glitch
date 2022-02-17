// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html
console.log('hello world');

window.TrelloPowerUp.initialize(
  {
    'card-badges': function(t, opts) {
      return t.card('all').then(function(card){
        console.log(card);
        if(card && card.customFieldItems) {
          var allDate;
          var listDate;
          for (let index = 0; index < card.customFieldItems.length; index++) {
              var field = card.customFieldItems[index];
              if(field.idCustomField === "620ea17bc671633d435c9c8f")
                allDate = field.value;
              if(field.idCustomField === "620ea19d65070d0323088724")
                listDate = field.value;
          }
          var lagDays = (date2) => {
            return Math.ceil(Math.abs(date2.getTime() - Date.now()) / (1000 * 3600 * 24))
          }
          var getColor = (days) => {
            if(days > 15)
              return 'red';
            if(days > 5)
              return 'green';
            return 'yellow';
          }
          var daysLagAll = lagDays(new Date(allDate.date));
          var daysLagList = lagDays(new Date(listDate.date));
        }
        return [{
          text: 'Карте ' + daysLagAll + ' дней',
          color: getColor(daysLagAll),          
        }, {
          text: "В этом листе:" + daysLagList + ' дней',
          color: getColor(daysLagList),          
        }]
      });
    }
  });