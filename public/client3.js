! function() {
    "use strict";

    
    var findIndex = function(array, predicate, thisArg) {
            if (Array.prototype.findIndex) return Array.prototype.findIndex.call(array, predicate);
            for (var len = array.length >>> 0, k = 0; k < len;) {
                var kValue = array[k];
                if (predicate.call(thisArg, kValue, k, array)) return k;
                k++
            }
            return -1
        },
        DAY = 864e5,
        TIME_FROM_LARGEST = [31536e6, 2628e6, 6048e5, DAY, 36e5, 6e4, 1e3],
        NAMES_FROM_LARGEST = ["year", "month", "week", "day", "hour", "minute", "second"],
        formatTime = function(ms) {
            if (ms < 1e3) return "1 second";
            var smallerIdx = findIndex(TIME_FROM_LARGEST, function(t) {
                    return t < ms
                }),
                unit = TIME_FROM_LARGEST[smallerIdx],
                unitName = NAMES_FROM_LARGEST[smallerIdx],
                val = Math.round(ms / unit);
            return val + " " + unitName + (1 === val ? "" : "s")
        },
        isWeekendDay = function(time, weekendMode) {
            var day = new Date(time).getDay();
            return "FRISAT" === weekendMode && (5 == day || 6 == day) || "SATSUN" === weekendMode && (6 == day || 0 === day)
        },
        getDuration = function(start, end, weekendMode) {
            var duration = void 0;
            if (start = +start, end = +end, "SHOW" == (weekendMode = weekendMode || "SHOW")) duration = end - start;
            else if (isWeekendDay(start, weekendMode) || isWeekendDay(end, weekendMode)) {
                if (isWeekendDay(start, weekendMode)) {
                    var weekStartDate = new Date(start + DAY);
                    weekStartDate.setHours(0, 0, 0, 0);
                    for (var weekStart = weekStartDate.getTime(); isWeekendDay(weekStart, weekendMode);) weekStart += DAY;
                    start = weekStart
                }
                if (isWeekendDay(end, weekendMode)) {
                    var weekEndDate = new Date(end - DAY);
                    weekEndDate.setHours(23, 59, 59, 999);
                    for (var weekEnd = weekEndDate.getTime(); isWeekendDay(weekEnd, weekendMode);) weekEnd -= DAY;
                    end = weekEnd + 1
                }
                duration = end - start, duration -= 2 * Math.floor(duration / 6048e5) * DAY
            } else if ((duration = end - start) > DAY) {
                duration -= 2 * Math.floor(duration / 6048e5) * DAY;
                var startDay = new Date(start).getDay(),
                    endDay = new Date(end).getDay();
                endDay <= startDay && (endDay += 7);
                for (var i = startDay; i < endDay; i++) {
                    var currDay = i < 7 ? i : i - 7;
                    "FRISAT" !== weekendMode || 5 != currDay && 6 != currDay ? "SATSUN" !== weekendMode || 6 != currDay && 0 !== currDay || (duration -= 864e5) : duration -= 864e5
                }
            }
            return duration
        },
        Promise$1 = TrelloPowerUp.Promise,
        getCardTimeFromPowerupData = function(t, cardId) {
            return t.get(cardId, "shared", "timeInListDataVersion", null).then(function(dataVersion) {
                return 1 !== dataVersion ? null : t.get(cardId, "shared", "timesByListCardId", null).then(function(tilCardId) {
                    return tilCardId == cardId ? t.get(cardId, "shared", "timesByList", null) : Promise$1.resolve(null)
                }).catch(function(e) {
                    bugsnagClient.notify(e)
                })
            })
        },
        getLatestListEntry = function(cardTimesByList) {
            for (var ret = {}, mostRecentTime = void 0, mostRecentList = void 0, i = Object.keys(cardTimesByList).length - 1; i >= 0; i--)
                for (var listId = Object.keys(cardTimesByList)[i], j = Object.keys(cardTimesByList[listId]).length - 1; j >= 0; j--) {
                    var enteredTime = Object.keys(cardTimesByList[listId])[j];
                    (!mostRecentTime || enteredTime > mostRecentTime) && (mostRecentTime = enteredTime, mostRecentList = listId)
                }
            return ret[mostRecentList] = mostRecentTime, ret
        },
        getLatestEntryTime = function(cardTimesByList) {
            var latest = getLatestListEntry(cardTimesByList);
            return latest ? latest[Object.keys(latest)[0]] : null
        },
        asyncSaveCardTimeInList = function(t, cardId, cardTimesByList) {
            return t.get(cardId, "shared", "timesByListCardId", null).then(function(tilCardId) {
                return tilCardId == cardId ? t.get(cardId, "shared", "timesByList", {}).then(function(localTimesByList) {
                    return createLocalTimeInList(t, cardId, cardTimesByList, localTimesByList)
                }) : createLocalTimeInList(t, cardId, cardTimesByList, {})
            })
        },
        createLocalTimeInList = function(t, cardId, cardTimesByList, localTimesByList) {
            return t.get(cardId, "shared", "timeInListDataVersion", null).then(function(dataVersion) {
                1 !== dataVersion && (localTimesByList = {});
                for (var i = Object.keys(cardTimesByList).length - 1; i >= 0; i--) {
                    var listId = Object.keys(cardTimesByList)[i];
                    localTimesByList[listId] || (localTimesByList[listId] = {});
                    for (var j = Object.keys(cardTimesByList[listId]).length - 1; j >= 0; j--) {
                        var enteredTime = Object.keys(cardTimesByList[listId])[j];
                        localTimesByList[listId][enteredTime] || (localTimesByList[listId][enteredTime] = cardTimesByList[listId][enteredTime])
                    }
                }
                return t.set(cardId, "shared", {
                    timesByList: localTimesByList,
                    timesByListCardId: cardId,
                    timeInListDataVersion: 1
                })
            })
        },
        getCardTimeInList = function(cardId, listId, boardId, t) {
            var isReloadForCardId = "61f00e674fbdc58d1d57a152" === cardId;
            return getCardTimeFromPowerupData(t, cardId).then(function(cardTimesByList) {
                return getLatestListEntry(cardTimesByList);
            }).then(function(cardTimeEnteredList) {
                return t.get("board", "shared", "weekendMode", "SHOW").then(function(weekendMode) {
                    return cardTimeEnteredList && cardTimeEnteredList[listId] ? getDuration(cardTimeEnteredList[listId], (new Date).getTime(), weekendMode) : null
                })
            }).catch(function(e) {
                bugsnagClient.notify(e)
            })
        },
        Promise$2 = TrelloPowerUp.Promise,
        getCardTimeFromPowerupData$1 = function(t, cardId) {
            return t.get(cardId, "shared", "timeOnBoardDataVersion", null).then(function(dataVersion) {
                return 1 !== dataVersion ? null : t.get(cardId, "shared", "timesOnBoardCardId", null).then(function(tilCardId) {
                    return tilCardId == cardId ? t.get(cardId, "shared", "timeOnBoard", null) : Promise$2.resolve(null)
                }).catch(function(e) {
                    bugsnagClient.notify(e)
                })
            })
        },
        getLatestBoardEntry = function(timesByBoard) {
            for (var ret = {}, mostRecentTime = void 0, mostRecentBoard = void 0, i = Object.keys(timesByBoard).length - 1; i >= 0; i--)
                for (var boardId = Object.keys(timesByBoard)[i], j = Object.keys(timesByBoard[boardId]).length - 1; j >= 0; j--) {
                    var enteredTime = Object.keys(timesByBoard[boardId])[j];
                    (!mostRecentTime || enteredTime > mostRecentTime) && (mostRecentTime = enteredTime, mostRecentBoard = boardId)
                }
            return ret[mostRecentBoard] = mostRecentTime, ret
        },
        getCardTimeOnBoard = function(cardId, boardId, t) {
            return getCardTimeFromPowerupData$1(t, cardId).then(function(cardTimesByBoard) {
                return getLatestBoardEntry(cardTimesByBoard);
            }).then(function(cardTimeEnteredBoard) {
                return t.get("board", "shared", "weekendMode", "SHOW").then(function(weekendMode) {
                    return cardTimeEnteredBoard && cardTimeEnteredBoard[boardId] ? getDuration(cardTimeEnteredBoard[boardId], (new Date).getTime(), weekendMode) : null
                })
            }).catch(function(e) {
                bugsnagClient.notify(e)
            })
        },
        Promise$3 = TrelloPowerUp.Promise,
        getTimeOnBoardBadge = function(t, card) {
            var boardId = t.getContext().board;
            return {
                dynamic: function(t) {
                    return getCardTimeOnBoard(card.id, boardId, t).then(function(time) {
                        var text = "refreshing...";
                        return time && (text = formatTime(time)), {
                            title: "Time On Board",
                            text: text,
                            refresh: 10,
                            icon: "./images/days-on-board.svg"
                        }
                    }).then(function(badge) {
                        return getStatus(t).then(function(status) {
                            return status && status.boardTracked && (status.subscriptionActive || status.trialActive) ? badge : {
                                refresh: 10
                            }
                        })
                    }).catch(function(e) {
                        bugsnagClient.notify(e)
                    })
                }
            }
        },
        getTimeInListBadge = function(t) {
            var boardId = t.getContext().board;
            return {
                dynamic: function(t) {
                    return t.card("id", "idList").then(function(card) {
                        return getCardTimeInList(card.id, card.idList, boardId, t).then(function(time) {
                            var text = "refreshing...";
                            return time && (text = formatTime(time)), {
                                title: "Time In list",
                                text: text,
                                refresh: 10,
                                icon: "./images/days-in-list.svg",
                                color: void 0
                            }
                        }).then(function(badge) {
                            return getStatus(t).then(function(status) {
                                return status && status.boardTracked && (status.subscriptionActive || status.trialActive) ? badge : {
                                    refresh: 10
                                }
                            })
                        }).catch(function(e) {
                            bugsnagClient.notify(e)
                        })
                    })
                }
            }
        },
        getCardBadges = function(t, isCardDetail) {
            var p_board = t.get("board", "shared", "lists_ignored"),
                p_showBoardTime = t.get("board", "shared", "showTimeOnBoard"),
                p_card = t.card("id", "idList");
            return Promise$3.props({
                card: p_card,
                listsIgnored: p_board,
                showTimeOnBoard: p_showBoardTime
            }).then(function(_ref) {
                var card = _ref.card,
                    listsIgnored = _ref.listsIgnored,
                    showTimeOnBoard = _ref.showTimeOnBoard,
                    ret = [],
                    timeInListBadge = getTimeInListBadge(t);
                return listsIgnored && listsIgnored[card.idList] ? isCardDetail || (timeInListBadge.dynamic(t), ret.push({
                    refresh: 60
                })) : (ret.push(timeInListBadge), showTimeOnBoard && ret.push(getTimeOnBoardBadge(t, card))), ret
            }).catch(function(e) {
                bugsnagClient.notify(e)
            })
        };
    TrelloPowerUp.initialize({
        "card-badges": function(t) {
            return getCardBadges(t, !1)
        },
        "card-detail-badges": function(t) {
            return getCardBadges(t, !0)
        },
        "card-back-section": function(t) {
            return {
                title: "Card time by list",
                icon: "./images/logo-grey.png",
                content: {
                    type: "iframe",
                    url: t.signUrl("./show-card-time-by-list.html"),
                    height: 50
                }
            }
        },
        "list-actions": function(t) {
            return t.get("board", "shared", "lists_ignored").then(function(listsIgnored) {
                    var ignored = listsIgnored && listsIgnored[t.getContext().list];
                    return {
                        text: ignored ? "Track Time In List" : "Stop tracking Time In List",
                        callback: function(t) {
                            listsIgnored || (listsIgnored = {}), listsIgnored[t.getContext().list] = !ignored, t.set("board", "shared", "lists_ignored", listsIgnored), t.closePopup()
                        }
                    }
                })
        }
    })
}();
//# sourceMappingURL=powerup.js.map