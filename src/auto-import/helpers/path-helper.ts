import * as path from 'path';
import * as fs from 'fs';

export class PathHelper {

    public static normalisePath(path, absolute) {
        let removeFileExtenion = (rp) => {
            if (rp) {
                rp = rp.substring(0, rp.lastIndexOf('.'))
            }
            return rp;
        }

        let makeRelativePath = (rp) => {

            // https://github.com/soates/Auto-Import/pull/47/commits/fe32277511820d687267bda1674f57625addcea7
            // if (!rp.startsWith(preAppend)) {
            if (!rp.startsWith('./') && !rp.startsWith('../')) {
                rp = './' + rp;
            }

            if (/^win/.test(process.platform)) {
                rp = rp.replace(/\\/g, '/');
            }

            return rp;
        }

        if (!absolute) {
            path = makeRelativePath(path);
        }
        path = removeFileExtenion(path);

        return path;
    }

    public static getRelativePath(a, b): string {
        // Ensure we have a path to a folder
        if (fs.lstatSync(a).isFile()) {
            a = path.dirname(a);
        }
        return path.relative(a, b);
    }

    public static joinPaths(a, b): string {
        return path.join(a, b);
    }
}
