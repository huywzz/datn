/* eslint-disable */
const fs = require('fs-extra');
const path = require('path');

// Get arguments from npm config or process.argv
const name = process.env.npm_config_name || process.argv.find((a) => a.startsWith('--name='))?.split('=')[1];
const env = process.env.npm_config_env || process.argv.find((a) => a.startsWith('--env='))?.split('=')[1] || 'local';

if (!name) {
  console.error('Usage: npm run seed:create --name=create-user --env=dev');
  process.exit(1);
}

console.log(`✅ Creating seed file: ${name} for environment: ${env}`);
const timestamp = Date.now();

const dir = path.resolve(`src/provider/mysql/seeds/${env}`);
const filePath = path.join(dir, `${timestamp}-seed-${name}.ts`);

fs.ensureDirSync(dir);

const className =
  name
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('') + 'Seed';

const content = `import { DataSource } from 'typeorm';

export class ${className} {
  public async up(dataSource: DataSource): Promise<void> {
    // TODO: Insert seed data here
  }

  public async down(dataSource: DataSource): Promise<void> {
    // TODO: Revert seed data here
  }
}
`;

fs.writeFileSync(filePath, content);

console.log(`✅ Seed file created successfully: ${filePath}`);
