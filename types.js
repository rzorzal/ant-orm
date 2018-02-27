const TYPES = {
    NUMBER: "number",
    STRING: "string",
    BOOL: "bool",
    DATE: "date",
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


        if(type == this.DATE){
            if(typeof data === "undefined"){
                return undefined;
            }
            if(data === null) return null;
            return new Date(data);
        }

        return data;
    }
}

module.exports = TYPES;
