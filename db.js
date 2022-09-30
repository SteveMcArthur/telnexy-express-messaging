// Database
const mysql = require('mysql');

let cachedConnection = null;


function closeConnection() {
    if (cachedConnection) {
        console.log("Closing connection...");
        cachedConnection.end(function (err) {
            if (err) {
                console.log(err);
            }
            console.log("Connection ended");
            cachedConnection = null;
        })
    }
}

function getConnection() {
    if (!cachedConnection) {
        cachedConnection = mysql.createConnection({
            host: "213.171.200.102",
            user: "tutoradmin",
            password: "khX6usyJH83ea1ypLPqr"
        });
    }

    return cachedConnection;
}

let timeout;
let interval = 1000 * 30;

function query(qry, values, cb) {
    let connection = getConnection();
    if(timeout){
        clearTimeout(timeout);
    }
    //close connection after 5 minutes idle
    timeout = setTimeout(closeConnection,interval);
    connection.query(qry, values, function (err, rows) {
        if(cb){
            cb(err,rows);
        }
    });
}

const moment = require("moment");
const chartdata = require("./chartdata");

chartdata.init(query);


function saveResults(data, searchterm, countryId) {
    const dt = new Date();
    const time = dt.getTime();
    const sdate = moment(dt).format("YYYY-MM-DD HH:mm:ss")
    let values = []
    data.forEach(function (item) {
        values = [
            searchterm,
            time,
            sdate,
            item[0],
            item[1],
            item[2],
            item[3],
            item[6],
            countryId
        ]
        query("INSERT INTO tutorbase.ebay_search_results (searchterm,date,sdate, pos, seller, price, title, itemId, site) VALUES (?,?,?,?,?,?,?,?,?)", values);
    });

}

function getListOfSearchterms(cb) {
    query("SELECT searchterm, site, count(*) cnt FROM tutorbase.ebay_search_results GROUP BY searchterm, site",null,cb);
  
}

function getPositionsPerSearchterm(seller, searchterm, site, cb) {
    let values = [seller, searchterm, site];
    let sql = "SELECT pos,title,date,itemId,seller FROM tutorbase.ebay_search_results WHERE seller = ? and searchterm = ? and site = ?";
    if (!seller) {
        values = [searchterm, site];
        sql = "SELECT pos,title,date,itemId,seller FROM tutorbase.ebay_search_results WHERE searchterm = ? and site = ?";
    }
    query(sql, values, function (err, rows) {
        if (!err) {
            let result = {
                searchterm: searchterm,
                site: site,
                results: rows
            }
            cb(err,result);
        } else {
            cb(err);
        }

    })
}

function getListOfSearchtermsByDate(cb) {
    query("SELECT searchterm,date,site FROM tutorbase.ebay_search_results WHERE searchterm IS NOT NULL GROUP BY searchterm,date,site ORDER BY searchterm, date desc", function (err, rows) {
        if (!err) {
            let result = rows.map(item => item.searchterm);
            rows.forEach(function (item) {
                if (item.searchterm) {
                    result[item.searchterm + " (" + item.site + ")"][item.date] = {};
                }
            });
            cb(err,result);
        } else {
            cb(err);
        }

    })
}

function getItemsForSeller(seller, cb) {

    query("SELECT searchterm,date,seller,pos,title,itemId FROM tutorbase.ebay_search_results where seller = ? order by date,pos", seller, function (err, rows) {
        if (!err) {
            let result = {};
            rows.forEach(function (item) {
                result[item.date] = [];
            });
            rows.forEach(function (item) {
                result[item.date].push({
                    pos: item.pos,
                    title: item.title
                });
            })
            cb(err,result);
        } else {
            cb(err);
        }

    })
}

function getListOfDatesForSearchTerm(searchterm, cb) {

    query("SELECT date FROM tutorbase.ebay_search_results WHERE searchterm = ? GROUP BY date", searchterm, function (err, rows) {
        if (!err) {
            let result = rows.map(item => item.date);
            cb(err,result);
        } else {
            cb(err);
        }

    })
}

function getSearchTree(seller, cb) {
    getItemsForSeller(seller, function (sellerItems) {
        getListOfSearchtermsByDate(function (searchTerms) {
            for (key in searchTerms) {
                var dates = searchTerms[key];
                for (key2 in dates) {
                    dates[key2] = (sellerItems[key2])
                }
            }
            cb(err,searchTerms);
        });
    });
}

function getPreviousSearch(date, cb) {
    query("SELECT * FROM tutorbase.ebay_search_results WHERE date = ? order by pos", date, function (err, rows) {
        if (!err) {
            cb(rows);
        } else {
            cb(err);
        }

    })
}

function getLastSearchDate(cb) {
    query("select max(date) maxdate FROM tutorbase.ebay_search_results",null, function (err, row) {
        console.log(JSON.stringify(row));
        cb(err,row[0].maxdate);
    });
}


module.exports.getSearchTree = getSearchTree;
module.exports.getListOfSearchtermsByDate = getListOfSearchtermsByDate;
module.exports.getListOfDatesForSearchTerm = getListOfDatesForSearchTerm;
module.exports.getItemsForSeller = getItemsForSeller;
module.exports.getListOfSearchterms = getListOfSearchterms;
module.exports.saveResults = saveResults;
module.exports.getPreviousSearch = getPreviousSearch;
module.exports.getLastSearchDate = getLastSearchDate;
module.exports.getPositionsPerSearchterm = getPositionsPerSearchterm;
module.exports.getPositionLineChart = chartdata.getPositionLineChart;
module.exports.closeConnection = closeConnection;