module.exports = function(functions, argumentsList, ctx){
    if(!ctx) ctx = window;
    let results = functions.map(f => f.apply(ctx, argumentsList));
    return results;
}
