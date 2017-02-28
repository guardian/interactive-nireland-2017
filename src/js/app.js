import xr from 'xr'
import config from './../../config.json'
import Mustache from 'mustache'
import charttemplate from './../templates/chart.html'
import footertemplate from './../templates/footer.html'
import maptemplate from './../templates/map.html'
import mapsvg from './../templates/cartogram_600.html';
import chambertemplate from './../templates/chamber.html';

function isliveblog() {
    var url = window.top.location.pathname;
    if (url.search('/live/') > 0 || url.search('liveblog') > 0) {
        return true;
    } else { return false };
}

function cleannumber(input) {
    input = input.replace(/,/g, "");
    return parseFloat(input);
}

function ordercandidates(candidates) {
    //sort 
    candidates = candidates.sort(function (a, b) { return cleannumber(b.seats) - cleannumber(a.seats) });
    //find winner (so that bar widths can be calced)
    var winner = candidates[0];
    //calc bar widths
    candidates = candidates.map(function (c) {
        //add flags for DUP and SF
        if (c.party == "DUP") { c.dup = true };
        if (c.party == "SF") { c.sf = true };
        c.changevalue = cleannumber(c.change);
        if (c.changevalue > 0) {
            c.change = "+" + c.change;
        }
        c.fraction = cleannumber(c.seats) / cleannumber(winner.seats);
        c.width = (100 * c.fraction) + "%";
        c.seatshare = 100 * (cleannumber(c.seats) / 106);
        return c;
    });
    console.log(candidates);
    return candidates;
}


function orderconstituencies(constituencies) {

    console.log(constituencies);

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
                          console.log(c.availablecells);
                c.availablecells[i].classList.add("gv-" + p.name);
                c.availablecells[i].classList.add("gv-party-seat");
                c.availablecells.splice(i,1);
                console.log(c.availablecells);
                }
            }
        })
    })
}

xr.get(config.docDataJson).then((resp) => {
    var sheets = resp.data.sheets;
    var candidates = ordercandidates(sheets.results);
    var constituencies = orderconstituencies(sheets.constituencies);

    // render just the html for the blocks
    var charthtml = Mustache.render(charttemplate,candidates);
    var chamberhtml = Mustache.render(chambertemplate,candidates);

    var maphtml = Mustache.render(maptemplate, constituencies)

    var footerhtml = Mustache.render(footertemplate, sheets.furniture[0])

    // inject that rendered html into the empty div we declared in main.html
    document.querySelector(".gv-elex-heading").innerHTML = sheets.furniture[0].heading;
    document.querySelector(".gv-elex-subhead").innerHTML = sheets.furniture[0].subheading;
    document.querySelector(".gv-elex-footer").innerHTML = footerhtml;
    document.querySelector(".gv-elex-results").innerHTML = charthtml;
    document.querySelector(".gv-elex-chamber").innerHTML = chamberhtml;
    if (isliveblog() == true) {
        document.querySelector(".gv-elex-wrapper").classList.add("liveblog");
    }
    document.querySelector(".gv-elex-map").innerHTML = mapsvg;
    applyMapShading(constituencies);
    //    window.resize();
});



