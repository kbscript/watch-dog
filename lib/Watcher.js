var fs = require( 'fs' );
var util = require( 'util' );
var join = require( 'path' ).join;

var Watcher = module.exports = function ( path, callback, options ) {
    var watcher = this; 
    if ( typeof options !== "object" ) { options = {}; }
      
    if ( options.recursive === undefined ) { options.recursive = true; }
    watcher.recursive = options.recursive;
    
    if ( typeof options.exclude === "function" ) { watcher.exclude = options.exclude; }
    if ( util.isArray( options.exclude ) ) { watcher.exclude = options.exclude; }
    watcher.exclude = watcher.exclude || [];
    
    var i;
    for ( i = 0; i < watcher.exclude.length; i++ ) {
        if ( watcher.exclude[i] instanceof RegExp ) { continue; }                

        watcher.exclude[i] = new RegExp( escape(watcher.exclude[i] ), "gi" )
    }
    
    watcher.watchList = [];
    watcher.watchList.fsWatchers = {};
    watcher.counter = 0;
    
    //if no callback provided, then throw errors
    if ( typeof callback !== "function" ) { callback = function ( err ) { if ( err ) { throw new Error( err ); } }; }
    watcher.callback = callback;    

    fs.stat( path, watcher.load.bind(watcher, path) );
};

Watcher.prototype.watch = function ( path ) {
    var watcher = this;       
    watcher.watchList.push(path);
    watcher.watchList.fsWatchers[path] = fs.watch( path, watcher.callback );
};

Watcher.prototype.remove = function (path) {
    var watcher = this, oldList;
    if (typeof  path === "string") {
        watcher.watchList.splice(watcher.watchList.indexOf(path),1);

        watcher.watchList[path].close();
        delete watcher.watchList[path];
        return path;
    }

    for (path in watcher.watchList.fsWatchers) {
        if (!watcher.watchList.fsWatchers.hasOwnProperty(path)) {continue;}

        watcher.watchList.fsWatchers[path].close();
        delete watcher.watchList.fsWatchers[path];
    }

    oldList = watcher.watchList;
    watcher.watchList = [];
    watcher.watchList.fsWatchers = {};

    delete oldList.fsWatchers;

    return oldList;
};

Watcher.prototype.excluded = function ( filename, stats ) {
    var watcher = this, i;
    
    for ( i = 0; i < watcher.exclude.length; i++ ) { 
        if ( watcher.exclude[i].test( filename )) { return true; }
    }

    return false;  
};

Watcher.prototype.load = function ( path, err, stats ) {
    var watcher = this;
       
    if ( err || watcher.excluded( path, stats ) ) { return; }

    watcher.watch( path, stats );
            
    if ( !watcher.recursive || !stats.isDirectory( ) ) { return; }

    watcher.counter++; //add count for each dir we check
    fs.readdir( path, function ( err, dir ) {
        if ( err ) { return; }
        
        var i, subpath;
        for ( i = 0; i < dir.length; i++ ) {
            subpath = join( path, dir[i] );

            watcher.counter++; //add a count for each item we are checking stats for
            fs.stat( subpath, function ( err, stats ) {
                var subpath = this.subpath;

                watcher.counter--; //then decrement our count on stats.
                if (stats.isDirectory()) {watcher.load( subpath, err, stats );}

                if (watcher.counter === 0) {watcher.done();}
            }.bind( {subpath: subpath}) );
        }

        watcher.counter--; //decrement our count of dirs
        if (watcher.counter === 0) {watcher.done();} //if nothing else being checked we're done.
    } );  
};

//called when all files and folders are being watched.
Watcher.prototype.done = function ( ) { };

var escape = function ( text ) {
    return text.replace( /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&" );
};