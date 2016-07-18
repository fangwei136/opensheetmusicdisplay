import { IXmlElement } from "../../../src/Common/FileIO/Xml";
import { MXLtoIXmlElement } from "../../../src/Common/FileIO/Mxl.ts";
import { TestUtils } from "../../Util/TestUtils";

describe("MXL Tests", () => {
  // Generates a test for a mxl file name
  function testFile(scoreName: string): void {
    it(scoreName, (done: MochaDone) => {
      // Load the xml file content
      let mxl: string = TestUtils.getMXL(scoreName);
      chai.expect(mxl).to.not.be.undefined;
      // Extract XML from MXL
      // Warning: the sheet is loaded asynchronously,
      // (with Promises), thus we need a little fix
      // in the end with 'then(null, done)' to
      // make Mocha work asynchronously
      MXLtoIXmlElement(mxl).then(
        (score: IXmlElement) => {
          chai.expect(score).to.not.be.undefined;
          chai.expect(score.name).to.equal("score-partwise");
          done();
        },
        (exc: any) => { throw exc; }
      ).then(undefined, done);
    });
  }

  // Test all the following mxl files:
  let scores: string[] = ["MozartTrio"];
  for (let score of scores) {
    testFile(score);
  }

  // Test failure
  it("Corrupted file", (done: MochaDone) => {
    MXLtoIXmlElement("").then(
      (score: IXmlElement) => {
        chai.expect(score).to.not.be.undefined;
        chai.expect(score.name).to.equal("score-partwise");
        done(new Error("Empty zip file was loaded correctly. How is that even possible?"));
      },
      (exc: any) => { done(); }
    );
  });
});