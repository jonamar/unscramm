import { toMatchImageSnapshot } from 'jest-image-snapshot';

export default {
  setup() {
    expect.extend({ toMatchImageSnapshot });
  },
  async postVisit(page, context) {
    // Wait for any animations to complete
    await page.waitForTimeout(500);
    
    // Take a screenshot and compare with baseline
    const image = await page.screenshot();
    
    // Only snapshot the Letter component stories
    if (context.title.includes('Letter')) {
      expect(image).toMatchImageSnapshot({
        customSnapshotsDir: `${process.cwd()}/__snapshots__`,
        customSnapshotIdentifier: `${context.title}-${context.name}`.replace(/\\s+/g, '-').toLowerCase(),
      });
    }
  },
}; 