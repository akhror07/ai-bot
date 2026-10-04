import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pptxgen = require('pptxgenjs');
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

async function run() {
  const pres = new pptxgen();
  pres.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
  pres.layout = 'WIDE';

  const slide = pres.addSlide();
  slide.addText('Transition & Image Test', { x: 1, y: 1, fontSize: 24 });

  console.log('Downloading test image...');
  const imgRes = await fetch('https://image.pollinations.ai/prompt/ocean%20water%20waves?width=400&height=300&nologo=true');
  const imgBuf = Buffer.from(await imgRes.arrayBuffer());
  const imgBase64 = 'image/jpeg;base64,' + imgBuf.toString('base64');

  slide.addImage({ data: imgBase64, x: 7, y: 1.5, w: 5, h: 4 });

  const buffer = await pres.write({ outputType: 'nodebuffer' });
  const zip = await JSZip.loadAsync(buffer);

  let slideXml = await zip.file('ppt/slides/slide1.xml').async('string');
  console.log('Original has transition:', slideXml.includes('<p:transition'));

  // Inject transition
  slideXml = slideXml.replace('</p:sld>', '<p:transition spd="med"><p:fade/></p:transition></p:sld>');
  zip.file('ppt/slides/slide1.xml', slideXml);

  const finalBuf = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync('temp/test_transition.pptx', finalBuf);
  console.log('Saved temp/test_transition.pptx with transition & image! Size:', finalBuf.byteLength);
}

run().catch(console.error);
