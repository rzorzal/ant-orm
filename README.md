# ANT


## Description
 It is a small, secure and fast ORM for indexedDB. Created for projects who needed to encapsule their Object Stores into models and a readable API for comunication with the DB.

 It is using Web Workers for isolate de access to DB from the default thread. Look at the articles in the bottom of this document and see why it's good to your project.


## Instalation

Just run:

`
$ npm i --save ant-orm
`

If you aren't using npm and prefer import, junt download in the `dist` folder the `ANT.js` file and place into your HTML like this:

`<script src="/path/to/ANT.js"></script>`

Than you can copy the `workers folder` and import to your project.


## How to build

For building this projet is simples:

`$ npm run build`

## Usage

### Initialization

```javascript
ANT.init({
    databaseName: "DATABASE NAME",
    workersPath: "/path/to/workers",
    version: 1, //version of DB
    modelsPaths: {
        User: "/models/users.js" //Name of your model and path to your model
    }
});
```

### Defining Model

Just create a js file:

```javascript
class User extends ANT.Model {
    get columns(){
        return this.setColumns({
            id: { type: ANT.TYPES.NUMBER, unique: true },
            name: { type: ANT.TYPES.STRING },
            active: { type: ANT.TYPES.BOOL, defaultValue: true }
        });
    }
}

```

### TYPES

```javascript
    const number = ANT.TYPES.NUMBER;
    const string = ANT.TYPES.STRING;
    const boolean = ANT.TYPES.BOOL;
```

### Bulk a Model

```javascript
    let user = new Ant.User({
        id: 1,
        name: "Ricardo Zorzal"
    })
```

### Persisting a Model

```javascript
    let user = new Ant.User({
        id: 1,
        name: "Ricardo Zorzal"
    });

    await user.persist();
```

### Creating a Model

```javascript
    let user = await Ant.User.create({
        id: 1,
        name: "Ricardo Zorzal"
    })
```

### Updating a Model

```javascript
    let user = await Ant.User.create({
        id: 1,
        name: "Ricardo Zorzal"
    });

    user = await user.update({
        name: "Ricardo Zorzal Davila"
    });
```


### Destroying a Model

```javascript
    let user = await Ant.User.create({
        id: 1,
        name: "Ricardo Zorzal"
    });

    await user.destroy();
```

### Destroying a Model

```javascript
    let user = await Ant.User.create({
        id: 1,
        name: "Ricardo Zorzal"
    });

    await user.destroy();
```

### Query

#### Simple Query

```javascript
    let users = await Ant.User.findAll({
        name: "Ricardo Zorzal"
    });
```

#### Operators

```javascript
    let users = await Ant.User.findAll({
        name: {
            "$eq": "equals",
            "$ne": "not equals",
            "$gt": "greater than",
            "$gte": "greater than equals",
            "$lt": "less than",
            "$lte": "less than equals",
            "$btw": "between",
            "$btwe": "between equals",
            "$in": "IN",
            "$like": "LIKE",
            "$notLike": "NOT LIKE"
        }
    });
```

##  Why use Workers instead of default thread

1- http://blog.teamtreehouse.com/using-web-workers-to-speed-up-your-javascript-applications

2- https://developer.mozilla.org/docs/Web/API/Worker

Fast and Secure

## Contributions

Please if you have problems, ideias or whatever use the issue board on github. We are always waiting for a new Pull Request.
