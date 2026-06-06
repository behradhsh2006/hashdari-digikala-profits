import fs from 'node:fs'

const path = '.output/server/wrangler.json'

if (fs.existsSync(path)) {
  const config = JSON.parse(fs.readFileSync(path, 'utf8'))
  if (config.assets?.binding === 'ASSETS') {
    config.assets.binding = 'STATIC_ASSETS'
    fs.writeFileSync(path, JSON.stringify(config, null, 2))
    console.log('✓ Fixed ASSETS binding')
  }
}
