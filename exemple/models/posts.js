class Post extends ANT.Model {


    get columns(){ 
        return this.setColumns({
            id: { type: ANT.TYPES.NUMBER },
            texto: { type: ANT.TYPES.STRING },
            ClienteId: { type: ANT.TYPES.NUMBER }
        });
    }


}
