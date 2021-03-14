import * as url from "url";
import { PassThrough, Readable } from "stream";
import * as sinon from "sinon";
import * as https from "https";

let httpMock: sinon.SinonStub;

function initHttpMock(): void {
  httpMock = sinon.stub(https, "request");
}

function mockHttpResponse(data: unknown, urlStr: string): void {
  const streamMock: PassThrough & { statusCode?: number } = new PassThrough();
  streamMock.push(typeof data === "string" ? data : JSON.stringify(data));
  streamMock.end();
  mockStreamResponse(streamMock, urlStr);
}
export default function mockHttp(params: [unknown, string][]): void {
    initHttpMock();
  params.forEach(([data, urlStr ]) => {
    if (data instanceof Readable) {
      mockStreamResponse(data, urlStr);
    } else {
      mockHttpResponse(data, urlStr);
    }
  });
}
function mockStreamResponse(
  streamMock: Readable & { statusCode?: number },
  urlStr: string
): void {
  // eslint-disable-next-line no-param-reassign
  streamMock.statusCode = 200;
  const parsedUrl = url.parse(urlStr);
  httpMock
    .withArgs({
      host: parsedUrl.host,
      path: parsedUrl.path,
      agent: undefined,
      rejectUnauthorized: false,
      headers: { "User-Agent": "TabNine.tabnine-vscode" },
    })
    .callsFake(
      (
        _url,
        callback: (stream: Readable & { statusCode?: number }) => void
      ) => {
        callback(streamMock);
        return { end: sinon.stub(), on: sinon.stub() };
      }
    );
}
