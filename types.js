const TYPES = {
    NUMBER: "number",
    STRING: "string",
    BOOL: "bool",
    convert: function(data, type){
        if(type == this.NUMBER){
            return parseFloat(data);
        }

        if(type == this.STRING){
            if(typeof data === "undefined"){
                return undefined;
            }
            if(data === null){
                return null;
            }
            return (new String(data)).toString();
        }

        if(type == this.BOOL){
            return !!data;
        }

        return data;
    }
}

module.exports = TYPES;
