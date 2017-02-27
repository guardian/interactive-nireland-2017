
    candidates = candidates.filter(function(c){ 
        if (c.party.length > 0) {
        return c;
    }}
    );

    candidates.sort(function(a,b){
        return a.share - b.share;
    })

    //console.log(candidates);   

    for (var i = 0; candidates.length; i++) {
        var candidate = candidates[i];
      //  console.log(candidate);

    }

    return candidates;