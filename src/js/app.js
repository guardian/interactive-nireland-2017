import xr from 'xr'
import config from './../../config.json'
import Mustache from 'mustache'
import headertemplate from './../templates/header.html'
import charttemplate from './../templates/chart.html'
import footertemplate from './../templates/footer.html'
import maptemplate from './../templates/map.html'
import mapsvg from './../templates/carto600new.html';
import mobmapsvg from './../templates/carto300new.html';
import chambertemplate from './../templates/chamber.html';

const totalseats = 90;
var constituencies;

function isMobile() {
    if (window.innerWidth < 620) {
        return true;
    }
}

function isliveblog() {
    var url = window.top.location.pathname;
    if (url.search('/live/') > 0 || url.search('liveblog') > 0) {
        return true;
    } else { return false };
}

function cleannumber(input) {
    if (typeof input == "string" )
{    input = input.replace(/,/g, "");
    return parseFloat(input);
}
    if (typeof input == "number") {
        return input;
    }
}

function ordercandidates(candidates) {
    //sort 
    candidates = candidates.sort(function (a, b) { return cleannumber(b.seats) - cleannumber(a.seats) });
    //find winner (so that bar widths can be calced)
    var winner = candidates[0];
    //calc bar widths
    candidates = candidates.map(function (c) {
        if (cleannumber(c.seats) > 0) { c.chartable = true };
        c.votesharevalue = cleannumber(c.voteshare);
        c.changevalue = cleannumber(c.change);
        if (c.changevalue > 0) {
            c.change = "+" + c.change;
        }
        c.fraction = cleannumber(c.seats) / cleannumber(winner.seats);
        c.width = (100 * c.fraction) + "%";
        return c;
    });
 //   console.log(candidates);
    return candidates;
}




function orderconstituencies(constituencies) {

    // console.log(constituencies);

    constituencies.forEach(function (s) {

        // get an array of party results for each constituency
        s.parties = Object
            .keys(s)
            .filter((d) => { return d != "constituency" && d != "Total" && d != "Undeclared" && d != "map_id" });
        s.parties = s.parties.map(function (k) {
            return {
                "name": k,
                "value": s[k]
            }
        });
        s.parties.sort(function (a, b) { return cleannumber(b.value) - cleannumber(a.value) })

        //end of the forEach for constituencies
    });
    return constituencies;
}

function applyMapShading(constituencies) {
    var cells = document.querySelectorAll("g");
    cells = Array.from(cells);
    constituencies.forEach(function (c) {
        //find the seat-level cells for this constituency
        c.mycells = cells.filter(function (x) { return x.id.match(c.map_id) && x.id.match("x5F") })

        c.availablecells = c.mycells;
        //get each party in turn 
        c.parties.forEach(function (p) {

            //for this party's seats, apply classes until there are no seats left
            for (var i = 0; i < cleannumber(p.value); i++) {
                //apply a class
                if (c.availablecells.length > 0) {
                    c.availablecells[0].classList.add("gv-" + p.name);
                    c.availablecells[0].classList.add("gv-party-seat");
                    c.availablecells.shift();
                }
            }
        })
    })


}

function chartcandidates(candidates) {
    var groupedcandidates = candidates;
    var others = {
        "party" : "Others",
        "displayname" : "Others",
        "seats" : 0,
        "seatshare" : 0
    }
    groupedcandidates.forEach(function combineothers(p){
        if (p.party != "DUP" && p.party != "SF" && p.party != "UUP" && p.party != "SDLP" && p.party != "APNI") {
        others.seats = others.seats + cleannumber(p.seats);
        p.grouped = true;
        } 
    })
    groupedcandidates.push(others);
            //add flag for parties that have seats (for legend)
    groupedcandidates.map(function(c) {
        if (cleannumber(c.seats) > 0 && c.grouped != true) { c.hasSeats = true };
                //add flags for DUP and SF
        if (c.party == "DUP") { c.dup = true };
        if (c.party == "SF") { c.sf = true };
        c.grouped ? c.seatshare = 0 : c.seatshare = (100 * (cleannumber(c.seats) / totalseats));
        return c;
    })  
    var summedseatshare = 0;      
    groupedcandidates.forEach(function sumseatshares (x) {
        summedseatshare += x.seatshare;
    })    
    return groupedcandidates;
}

xr.get(config.docDataJson).then((resp) => {
    //compile data into elements needed for mustache templates
    var sheets = resp.data.sheets;
    var fullcandidates = ordercandidates(sheets.results);
    var groupedcandidates = chartcandidates(sheets.results);
    constituencies = orderconstituencies(sheets.constituencies);
    var furniture = sheets.furniture[0];

    //compile mustache templates
    var headerhtml = Mustache.render(headertemplate, furniture)
    var charthtml = Mustache.render(charttemplate, fullcandidates);
    var chamberhtml = Mustache.render(chambertemplate, groupedcandidates);
    var maphtml = Mustache.render(maptemplate, constituencies)
    var footerhtml = Mustache.render(footertemplate, furniture)

    // inject rendered mustache html into the empty divs we declared in main.html
    document.querySelector(".gv-elex-heading-wrapper").innerHTML = headerhtml;
    document.querySelector(".gv-elex-footer").innerHTML = footerhtml;
    document.querySelector(".gv-elex-results").innerHTML = charthtml;
    document.querySelector(".gv-elex-chamber").innerHTML = chamberhtml;

    // get the appropriate map size
    if (isMobile() !== true) {
        document.querySelector(".gv-elex-map").innerHTML = mapsvg;
    } else { document.querySelector(".gv-elex-map").innerHTML = mobmapsvg; }

    //colour the map
    applyMapShading(constituencies);

    window.resize();



});


function replaceMap() {

    if (isMobile() !== true) {
        document.querySelector(".gv-elex-map").innerHTML = mapsvg;
    } else { document.querySelector(".gv-elex-map").innerHTML = mobmapsvg; }
    applyMapShading(constituencies)
}

window.onresize = replaceMap;


