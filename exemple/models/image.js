class Image extends ANT.Model {


    get columns(){
        return this.setColumns({
            id: { type: ANT.TYPES.NUMBER },
            url: { type: ANT.TYPES.STRING },
            name: { type: ANT.TYPES.STRING }
        });
    }


}
