// Copyright (C) 2011 Colin Walters <walters@verbum.org>
//
// This library is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 2 of the License, or (at your option) any later version.
//
// This library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the
// Free Software Foundation, Inc., 59 Temple Place - Suite 330,
// Boston, MA 02111-1307, USA.

const GLib = imports.gi.GLib;

const Format = imports.format;

const BUILTINS = [
    'create-vm-disk',
    'postprocess-disk',
    'repoweb',
    'shell',
    'trivial-autocompose'];

const EXTERNALS = [
    {'name': 'composeall',
     'description': 'compose a tree and create disk images'}
];

function getModule(unixName) {
    return imports.builtins[unixName.replace(/-/g, '_')];
}

function getClass(unixName) {
    let module = getModule(unixName);
    let camelParts = unixName.split(/-/);
    let camel = camelParts.map(function (part) {
	return part[0].toLocaleUpperCase() + part.substr(1);
    }).join('');
    return module[camel];
}

function usage(ecode) {
    print("Builtins:");
    for (let i = 0; i < BUILTINS.length; i++) {
	let unixName = BUILTINS[i];
	if (unixName.indexOf('internal-') == 0)
	    continue;
	let description = getClass(unixName).prototype.DESCRIPTION;
        print(Format.vprintf("    %s - %s", [unixName, description]));
    }
    for (let i = 0; i < EXTERNALS.length; i++) {
	let obj = EXTERNALS[i];
        print(Format.vprintf("    %s - %s", [obj.name, obj.description]));
    }
    return ecode;
}

let ecode = 1;
if (ARGV.length > 0 && (ARGV[0] == '-h' || ARGV[0] == '--help')) {
    ecode = usage(0);
} else {
    let name;
    let found = false;
    if (ARGV.length >= 1) {
	name = ARGV[0];
	for (let i = 0; i < BUILTINS.length; i++) {
	    if (BUILTINS[i] == name) {
		found = true;
		break;
	    }
	}
    }
    if (!found) {
	usage(1);
    } else {
	let argv = ARGV.concat();
	argv.shift();

	let loop = GLib.MainLoop.new(null, true);
	let cls = getClass(name);
	let instance = new cls;
	let cancellable = null;
	GLib.idle_add(GLib.PRIORITY_DEFAULT,
		      function() {
			  ecode = 1;
			  try {
			      instance.main(argv, loop, cancellable);
			      ecode = 0;
			  } finally {
			      loop.quit();
			  }
			  return false;
		      });
	loop.run();
    }
}
ecode;

    
    
