import '@storagehub/api-augment';
import { DataHavenDemo } from './operations/dataHavenDemo.js';

async function main(): Promise<void> {
  const demo = new DataHavenDemo();

  try {
    await demo.initialize();
    await demo.runDemo();
  } catch (error) {
    console.error('Error running demo:', error);
    process.exit(1);
  } finally {
    await demo.cleanup();
  }
}

main();
