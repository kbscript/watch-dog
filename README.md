watcher
=============

A simple Node.js watcher.  


## Install

````
npm install watcher
````

## Example

````js
    var path = require('path');
    var Watcher = require('watcher');
    var options = {recursive: true, exclude: [/(^|\\|\/)\./, "node_modules","obj"] };
    var watcher = new Watcher( path.resolve( __dirname ), function (event, name) {
        console.log("event: ", event);
        console.log("name: ", name);
        //now handle change
    }, options);
    
    //to unwatch
    watcher.remove(path.resolve('pathname'))
    
    // or to remove all listeners
    watcher.remove();
  ````
  
#### Options
  
##### recurisvie
  
Enable or disable a recursive watch on a directory.  If a file path is passed instead of a dir path then this is ignored.  Defaults to true.
  
#### exclude
  
Tells the watcher which files or dir names to ignore.  Accepts an array of `RegExp` or `string` converted to `/value/gi`.  Defaults to empty array.
  

## License

[MIT](LICENSE)
