import xr from 'xr'
import config from './../../config.json'
import Mustache from 'mustache'
import charttemplate from './../templates/chart.html'
import footertemplate from './../templates/footer.html'

function isliveblog() {
    var url = window.top.location.pathname;
    if (url.search('/live/') > 0 || url.search('liveblog') > 0){ 
        return true;
    } else {return false} ;
}

function cleannumber(input) {
    input = input.replace(/,/g, "");
    return parseFloat(input);
}

function ordercandidates(candidates) {
    //sort
    candidates = candidates.sort(function (a, b) { return cleannumber(b.votes) - cleannumber(a.votes) });
    //find winner (so that bar widths can be calced)
    var winner = candidates[0];
    //calc bar widths
    candidates = candidates.map(function (c) {
        c.changevalue = cleannumber(c.change);
        if (c.changevalue > 0) {
            c.change = "+" + c.change;
        }
        c.fraction = cleannumber(c.votes) / cleannumber(winner.votes);
        c.width = (100 * c.fraction) + "%"
        return c;
    });

    return candidates;
}


xr.get(config.docData).then((resp) => {
    var sheets = resp.data.sheets;
    var candidates = ordercandidates(sheets.results);

    // render just the html for the blocks
    var charthtml = Mustache.render(charttemplate, candidates);

    var footerhtml = Mustache.render(footertemplate,sheets.furniture[0])

    // inject that rendered html into the empty div we declared in main.html
    document.querySelector(".gv-elex-heading").innerHTML = sheets.furniture[0].heading;
    document.querySelector(".gv-elex-subhead").innerHTML = sheets.furniture[0].subheading;
    document.querySelector(".gv-elex-footer").innerHTML = footerhtml;
    document.querySelector(".gv-elex-results").innerHTML = charthtml;
    if (isliveblog() == true ) {
        document.querySelector(".gv-elex-wrapper").classList.add("liveblog");
    }
    

    window.resize();
});