import { toMatchImageSnapshot } from 'jest-image-snapshot';

export default {
  setup() {
    expect.extend({ toMatchImageSnapshot });
  },
  async postVisit(page, context) {
    // Only process Letter component stories
    if (!context.title.includes('Letter')) {
      return;
    }
    
    // Wait for any animations to complete and elements to stabilize
    await page.waitForTimeout(500);
    
    // Take a screenshot
    const image = await page.screenshot();
    
    // Determine if this is a reduced motion story
    const isReducedMotionStory = context.name.includes('ReducedMotion');
    
    // Create snapshot identifier with proper grouping based on motion preference
    const motionType = isReducedMotionStory ? 'reduced-motion' : 'normal-motion';
    
    // Match snapshots with special handling for reduced motion variants
    expect(image).toMatchImageSnapshot({
      customSnapshotsDir: `${process.cwd()}/__snapshots__/components`,
      customSnapshotIdentifier: `${context.title.toLowerCase().replace(/\s+/g, '-')}-${context.name.toLowerCase().replace(/\s+/g, '-')}-${motionType}`,
      failureThreshold: 0.01, // 1% threshold for pixel difference
      failureThresholdType: 'percent',
    });
    
    // Log snapshot captured for verification
    console.log(`Snapshot captured for: ${context.title}/${context.name} (${motionType})`);
  },
}; 