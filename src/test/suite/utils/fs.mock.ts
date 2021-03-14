
import * as fs from "fs";
import * as sinon from "sinon";

export default function mockExistsSync(args: [fs.PathLike, boolean][]): void {

    const existsSyncMock = sinon.stub(fs, "existsSync");
    args.forEach(([path,returnValue]) => {
        existsSyncMock.withArgs(path).returns(returnValue);    
    })
}