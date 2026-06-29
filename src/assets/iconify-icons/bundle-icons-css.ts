/**
 * This is an advanced example for creating icon bundles for Iconify SVG Framework.
 *
 * It creates a bundle from:
 * - All SVG files in a directory.
 * - Custom JSON files.
 * - Iconify icon sets.
 * - SVG framework.
 *
 * This example uses Iconify Tools to import and clean up icons.
 * For Iconify Tools documentation visit https://docs.iconify.design/tools/tools2/
 */
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'

// Installation: npm install --save-dev @iconify/tools @iconify/utils @iconify/json @iconify/iconify
import { cleanupSVG, importDirectory, isEmptyColor, parseColors, runSVGO } from '@iconify/tools'
import type { IconifyJSON } from '@iconify/types'
import { getIcons, getIconsCSS, stringToIcon } from '@iconify/utils'

/**
 * Script configuration
 */
interface BundleScriptCustomSVGConfig {
  // eslint-disable-next-line lines-around-comment
  // Path to SVG files
  dir: string

  // True if icons should be treated as monotone: colors replaced with currentColor
  monotone: boolean

  // Icon set prefix
  prefix: string
}

interface BundleScriptCustomJSONConfig {
  // eslint-disable-next-line lines-around-comment
  // Path to JSON file
  filename: string

  // List of icons to import. If missing, all icons will be imported
  icons?: string[]
}

interface BundleScriptConfig {
  // eslint-disable-next-line lines-around-comment
  // Custom SVG to import and bundle
  svg?: BundleScriptCustomSVGConfig[]

  // Icons to bundled from @iconify/json packages
  icons?: string[]

  // List of JSON files to bundled
  // Entry can be a string, pointing to filename or a BundleScriptCustomJSONConfig object (see type above)
  // If entry is a string or object without 'icons' property, an entire JSON file will be bundled
  json?: (string | BundleScriptCustomJSONConfig)[]
}

const sources: BundleScriptConfig = {
  json: [
    {
      filename: require.resolve('@iconify/json/json/tabler.json'),
      icons: [
        'cube-3d-sphere', 'ad', 'adjustments', 'ai', 'alarm', 'align-box-bottom-center',
        'align-center', 'align-left', 'align-right', 'alert-circle', 'alert-octagon',
        'alert-triangle', 'alert-triangle-filled', 'aperture', 'arrow-down', 'arrow-left', 'arrow-right',
        'arrow-up', 'atom', 'ban', 'bell', 'bold', 'book', 'book-2', 'bookmark',
        'bookmarks', 'box', 'brand-android', 'brand-apple', 'brand-facebook',
        'brand-facebook-filled', 'brand-github-filled', 'brand-google',
        'brand-google-filled', 'brand-instagram', 'brand-linkedin', 'brand-paypal',
        'brand-stackoverflow', 'brand-twitter', 'brand-twitter-filled', 'brand-windows', 'brand-youtube-filled', 'briefcase',
        'browser-check', 'building', 'building-bank', 'building-skyscraper', 'calculator', 'calendar',
        'calendar-month', 'calendar-time', 'calendar-up', 'car', 'cards',
        'certificate', 'certificate-2', 'chart-bar', 'chart-donut-2',
        'chart-histogram', 'chart-pie', 'chart-pie-2', 'chart-ppf', 'chart-sankey',
        'check', 'checkbox', 'checkup-list', 'checks', 'chevron-down', 'chevron-left',
        'chevron-right', 'chevron-right-pipe', 'chevron-up', 'circle',
        'circle-arrow-down', 'circle-arrow-up', 'circle-check', 'circle-check-filled', 'circle-dot',
        'circle-filled', 'circle-off', 'circle-x', 'clock', 'clock-hour-3', 'coin',
        'color-picker', 'copy', 'corner-down-left', 'corner-down-right', 'corner-left-down', 'corner-right-down', 'cpu', 'credit-card', 'credit-card-filled', 'crown',
        'currency-dollar', 'database', 'device-computer-camera', 'device-desktop',
        'device-desktop-analytics', 'device-imac-dollar', 'device-ipad-horizontal-plus',
        'device-laptop', 'device-mobile', 'devices', 'diamond', 'diamond-filled',
        'discount-check-filled', 'dots', 'dots-vertical', 'download', 'download-off',
        'edit', 'external-link', 'eye', 'eye-off', 'file', 'file-analytics',
        'file-description', 'file-dollar', 'file-info', 'file-invoice', 'file-pencil',
        'file-plus', 'file-spreadsheet', 'file-text', 'file-unknown', 'file-upload', 'flag', 'fold',
        'forms', 'gift', 'git-merge', 'globe', 'heart-handshake', 'heart-rate-monitor',
        'help-circle', 'home', 'hourglass', 'hourglass-high', 'icons', 'id',
        'info-circle', 'italic', 'key', 'language', 'layout', 'layout-board-split',
        'layout-grid', 'layout-grid-add', 'layout-navbar', 'lifebuoy', 'line', 'link',
        'list', 'list-check', 'list-details', 'list-search', 'loader', 'lock',
        'lock-check', 'lock-open', 'login', 'login-2', 'logout', 'mail', 'mail-check',
        'map', 'map-pin', 'menu-2', 'message', 'message-2', 'message-dots', 'messages',
        'minus', 'moon-stars', 'mouse', 'notification', 'oval-vertical', 'palette', 'pencil',
        'percentage', 'phone', 'phone-call', 'photo', 'playlist-add', 'plus',
        'point-filled', 'progress', 'rectangle', 'refresh', 'report', 'reload', 'school',
        'search', 'search-off', 'send', 'send-2', 'server', 'setting', 'settings',
        'settings-cog', 'shadow', 'share', 'shield-lock', 'ship', 'shopping-cart',
        'shopping-cart-check', 'smart-home', 'square', 'square-plus', 'stack-2',
        'star', 'star-filled', 'sun', 'table', 'table-plus', 'thumb-up',
        'thumb-up-filled', 'ticket', 'timeline', 'toggle-left', 'trash', 'trending-up',
        'truck', 'typography', 'underline', 'upload', 'user', 'user-cancel',
        'user-check', 'user-circle', 'user-down', 'user-plus', 'user-search',
        'user-shield', 'user-square', 'user-x',         'users', 'users-group', 'wallet', 'x'
      ]
    },
    {
      filename: require.resolve('@iconify/json/json/vscode-icons.json'),
      icons: ['file-type-excel']
    }
  ],

  svg: []
}

// File to save bundle to
const target = join(__dirname, 'generated-icons.css')

/**
 * Do stuff!
 */

;(async function () {
  // Create directory for output if missing
  const dir = dirname(target)

  try {
    await fs.mkdir(dir, {
      recursive: true
    })
  } catch (err) {
    //
  }

  const allIcons: IconifyJSON[] = []

  /**
   * Convert sources.icons to sources.json
   */
  if (sources.icons) {
    const sourcesJSON = sources.json ? sources.json : (sources.json = [])

    // Sort icons by prefix
    const organizedList = organizeIconsList(sources.icons)

    for (const prefix in organizedList) {
      const filename = require.resolve(`@iconify/json/json/${prefix}.json`)

      sourcesJSON.push({
        filename,
        icons: organizedList[prefix]
      })
    }
  }

  /**
   * Bundle JSON files and collect icons
   */
  if (sources.json) {
    for (let i = 0; i < sources.json.length; i++) {
      const item = sources.json[i]

      // Load icon set
      const filename = typeof item === 'string' ? item : item.filename
      const content = JSON.parse(await fs.readFile(filename, 'utf8')) as IconifyJSON

      // Filter icons
      if (typeof item !== 'string' && item.icons?.length) {
        const filteredContent = getIcons(content, item.icons)

        if (!filteredContent) throw new Error(`Cannot find required icons in ${filename}`)

        // Collect filtered icons
        allIcons.push(filteredContent)
      } else {
        // Collect all icons from the JSON file
        allIcons.push(content)
      }
    }
  }

  /**
   * Bundle custom SVG icons and collect icons
   */
  if (sources.svg) {
    for (let i = 0; i < sources.svg.length; i++) {
      const source = sources.svg[i]

      // Import icons
      const iconSet = await importDirectory(source.dir, {
        prefix: source.prefix
      })

      // Validate, clean up, fix palette, etc.
      await iconSet.forEach(async (name, type) => {
        if (type !== 'icon') return

        // Get SVG instance for parsing
        const svg = iconSet.toSVG(name)

        if (!svg) {
          // Invalid icon
          iconSet.remove(name)

          return
        }

        // Clean up and optimise icons
        try {
          // Clean up icon code
          await cleanupSVG(svg)

          if (source.monotone) {
            // Replace color with currentColor, add if missing
            // If icon is not monotone, remove this code
            await parseColors(svg, {
              defaultColor: 'currentColor',
              callback: (attr, colorStr, color) => {
                return !color || isEmptyColor(color) ? colorStr : 'currentColor'
              }
            })
          }

          // Optimise
          await runSVGO(svg)
        } catch (err) {
          // Invalid icon
          console.error(`Error parsing ${name} from ${source.dir}:`, err)
          iconSet.remove(name)

          return
        }

        // Update icon from SVG instance
        iconSet.fromSVG(name, svg)
      })

      // Collect the SVG icon
      allIcons.push(iconSet.export())
    }
  }

  // Generate CSS from collected icons
  const cssContent = allIcons
    .map(iconSet => getIconsCSS(iconSet, Object.keys(iconSet.icons), { iconSelector: '.{prefix}-{name}' }))
    .join('\n')

  // Save the CSS to a file
  await fs.writeFile(target, cssContent, 'utf8')

  console.log(`Saved CSS to ${target}!`)
})().catch(err => {
  console.error(err)
})

/**
 * Sort icon names by prefix
 */
function organizeIconsList(icons: string[]): Record<string, string[]> {
  const sorted: Record<string, string[]> = Object.create(null)

  icons.forEach(icon => {
    const item = stringToIcon(icon)

    if (!item) return

    const prefix = item.prefix
    const prefixList = sorted[prefix] ? sorted[prefix] : (sorted[prefix] = [])

    const name = item.name

    if (!prefixList.includes(name)) prefixList.push(name)
  })

  return sorted
}
