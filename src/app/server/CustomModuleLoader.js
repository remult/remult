"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore: 
var customModuleLoader = require("module");
var CustomModuleLoader = /** @class */ (function () {
    function CustomModuleLoader(root) {
        if (!root)
            root = '/distServer';
        customModuleLoader._originalResolveFilename = customModuleLoader._resolveFilename;
        customModuleLoader._resolveFilename = function (request, parent, isMain) {
            if (request.startsWith('@remult')) {
                request = process.cwd() + root + '/projects/' + request + '/';
                // console.log(request);
            }
            return customModuleLoader._originalResolveFilename(request, parent, isMain);
        };
    }
    return CustomModuleLoader;
}());
exports.CustomModuleLoader = CustomModuleLoader;
;
//# sourceMappingURL=CustomModuleLoader.js.map