## yy-drawer
A vanilla-javascript drawer UI component

## rationale
I needed a clean drawer for one of my projects. 

## Live Example
[https://davidfig.github.io/drawer/](https://davidfig.github.io/drawer/)

## API Documentation
[https://davidfig.github.io/drawer/jsdoc/](https://davidfig.github.io/drawer/jsdoc)

## Installation

    npm i drawer

## Simple Example
```js
var Drawer = require('yy-drawer');

new Drawer({
        size: 100,
        styles: {
            background: 'rgb(150,100,100)',
            color: 'white',
        },
        full: true,
        open: true,
        content: 'this is the contents of the drawer',
        contentStyles: {
            padding: '0.5em'
        }    
});
```

## license  
MIT License  
(c) 2018 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)