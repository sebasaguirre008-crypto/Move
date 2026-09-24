import { clothingCatalog } from '../data/clothingData'

const colorCompatibility = {
  negro: { negro: 0.8, rojo: 0.85, morado: 0.7, verde: 0.68, azul: 0.72, gris: 0.85, blanco: 0.66, beige: 0.68, marron: 0.7, rosa: 0.64 },
  blanco: { blanco: 0.75, beige: 0.88, gris: 0.78, azul: 0.8, marron: 0.75, rosa: 0.9, rojo: 0.72, verde: 0.82 },
  beige: { blanco: 0.88, beige: 0.9, marron: 0.92, verde: 0.86, gris: 0.82, azul: 0.74, rosa: 0.9 },
  marron: { marron: 0.9, beige: 0.92, negro: 0.7, verde: 0.8, azul: 0.74, blanco: 0.75 },
  rojo: { negro: 0.85, rojo: 0.9, morado: 0.74, blanco: 0.72, rosa: 0.84, verde: 0.38 },
  rosa: { blanco: 0.9, beige: 0.9, rojo: 0.84, morado: 0.8, gris: 0.7, azul: 0.65 },
  morado: { negro: 0.7, rojo: 0.74, rosa: 0.8, gris: 0.72, azul: 0.68, verde: 0.44, blanco: 0.62 },
  verde: { negro: 0.68, beige: 0.86, marron: 0.8, azul: 0.78, blanco: 0.82, gris: 0.76 },
  azul: { negro: 0.72, blanco: 0.8, verde: 0.78, gris: 0.8, beige: 0.74, morado: 0.68, marron: 0.74 },
  gris: { negro: 0.85, blanco: 0.78, beige: 0.82, azul: 0.8, morado: 0.72, marron: 0.75 },
  borgoña: { negro: 0.78, beige: 0.8, rosa: 0.82, rojo: 0.82, blanco: 0.72 },
  denim: { blanco: 0.8, beige: 0.78, negro: 0.7, azul: 0.9, gris: 0.76 },
  lavanda: { rosa: 0.86, blanco: 0.82, gris: 0.78 },
  crema: { blanco: 0.86, beige: 0.82, marron: 0.84, verde: 0.76 },
  amarillo: { beige: 0.8, marron: 0.72, blanco: 0.76 },
}

export function getStylePool(style) {
  return clothingCatalog[style] || []
}

function normalizeColorName(value) {
  return String(value).toLowerCase().trim()
}

function colorCompatibilityScore(itemA, itemB) {
  if (!itemA?.colors || !itemB?.colors) return 0.5

  const aColors = itemA.colors.map(normalizeColorName)
  const bColors = itemB.colors.map(normalizeColorName)

  let best = 0.4
  for (const aColor of aColors) {
    for (const bColor of bColors) {
      const direct = colorCompatibility[aColor]?.[bColor] ?? 0.35
      if (direct > best) best = direct
    }
  }

  return best
}

function combinationsOf(items, size) {
  if (size <= 0) return [[]]
  if (size > items.length) return []

  const results = []

  function build(start, current) {
    if (current.length === size) {
      results.push([...current])
      return
    }

    for (let index = start; index < items.length; index += 1) {
      current.push(items[index])
      build(index + 1, current)
      current.pop()
    }
  }

  build(0, [])
  return results
}

function scoreOutfit(items, style) {
  let score = 0
  const itemMap = new Map(items.map((item) => [item.category, item]))

  if (style === 'gothic') {
    score += 10
    if (itemMap.get('guantes')) score += 6
    if (itemMap.get('accesorio')) score += 4
    score += itemMap.get('blusa') ? 3 : 0
    score += itemMap.get('falda') ? 3 : 0
    score += itemMap.get('zapatos') ? 3 : 0
  }

  if (style === 'vintage') {
    const hasMain = itemMap.get('blusa') && (itemMap.get('pantalon') || itemMap.get('short') || itemMap.get('falda') || itemMap.get('vestido'))
    if (hasMain) score += 10
    if (itemMap.get('vestido')) score += 8
  }

  if (style === 'oldMoney') {
    const hasMain = itemMap.get('blusa') && (itemMap.get('pantalon') || itemMap.get('short') || itemMap.get('falda') || itemMap.get('vestido'))
    const hasShoes = itemMap.get('zapatos')
    const hasBag = itemMap.get('bolso')
    const hasCollar = itemMap.get('collar')
    const accessoryCount = items.filter((item) => item.category === 'accesorio').length

    if (hasMain) score += 12
    if (hasShoes) score += 8
    if (hasBag) score += 4
    if (hasCollar) score += 4
    if (accessoryCount) score += accessoryCount * 3
  }

  if (style === 'baddie') {
    score += 10
    if (itemMap.get('medias')) score += 2
    if (itemMap.get('zapatos')?.id?.toLowerCase().includes('zapatos2')) score += 3
  }

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const first = items[i]
      const second = items[j]
      const pairScore = colorCompatibilityScore(first, second)
      score += pairScore * 12

      if (first.type === 'top' && second.type === 'bottom') score += 5
      if (first.type === 'bottom' && second.type === 'shoes') score += 4
      if (first.type === 'top' && second.type === 'shoes') score += 2
      if (first.type === 'accessory' && second.type === 'accessory') score += 1
      if (first.category === second.category) score -= 8
    }
  }

  return Number(score.toFixed(2))
}

function createOutfitSignature(items) {
  return items
    .map((item) => item.id)
    .sort()
    .join('-')
}

function hasUniqueItems(items) {
  return new Set(items.map((item) => item.id)).size === items.length
}

function getAccessoryOptions(pool, maxExtras = 3) {
  const items = pool.filter((item) => item.category === 'accesorio')
  const options = [[]]

  for (let count = 1; count <= Math.min(items.length, maxExtras); count += 1) {
    for (const combo of combinationsOf(items, count)) {
      options.push(combo)
    }
  }

  return options
}

function validateStyleRules(style, items) {
  if (!items.length || !hasUniqueItems(items)) return false

  const byCat = new Map(items.map((item) => [item.category, item]))

  if (style === 'gothic') {
    const validCategories = ['blusa', 'falda', 'zapatos', 'guantes', 'accesorio']
    if (items.some((item) => !validCategories.includes(item.category))) return false
    if (!byCat.get('blusa') || !byCat.get('falda') || !byCat.get('zapatos')) return false

    const gloveCount = items.filter((item) => item.category === 'guantes').length
    const accessoryCount = items.filter((item) => item.category === 'accesorio').length
    const totalOptionalAccessories = gloveCount + accessoryCount

    if (totalOptionalAccessories > 1) return false
    if (totalOptionalAccessories < 1) return false
    return true
  }

  if (style === 'baddie') {
    const validCategories = ['blusa', 'falda', 'medias', 'zapatos']
    if (items.some((item) => !validCategories.includes(item.category))) return false
    if (!byCat.get('blusa') || !byCat.get('falda') || !byCat.get('zapatos')) return false
    if (byCat.get('zapatos')?.id?.toLowerCase().includes('zapatos2')) {
      return items.filter((item) => item.category === 'medias').length === 0
    }
    return items.filter((item) => item.category === 'medias').length === 1
  }

  if (style === 'vintage') {
    const dressCount = items.filter((item) => item.category === 'vestido').length
    const topCount = items.filter((item) => item.category === 'blusa').length
    const bottomCount = items.filter((item) => ['falda', 'pantalon', 'short'].includes(item.category)).length
    const bagCount = items.filter((item) => item.category === 'bolso').length
    const collarCount = items.filter((item) => item.category === 'collar').length
    const jacketCount = items.filter((item) => item.category === 'chaqueta').length
    const accessoryCount = items.filter((item) => item.category === 'accesorio').length

    if (dressCount > 0) {
      return dressCount === 1 && topCount === 0 && bottomCount === 0 && bagCount === 0 && collarCount === 0 && jacketCount === 0 && accessoryCount === 0
    }

    return topCount === 1 && bottomCount === 1 && bagCount <= 1 && collarCount <= 1 && jacketCount <= 1 && accessoryCount <= 1
  }

  if (style === 'oldMoney') {
    const dressCount = items.filter((item) => item.category === 'vestido').length
    const topCount = items.filter((item) => item.category === 'blusa').length
    const bottomCount = items.filter((item) => ['falda', 'pantalon', 'short'].includes(item.category)).length
    const shoeCount = items.filter((item) => item.category === 'zapatos').length
    const bagCount = items.filter((item) => item.category === 'bolso').length
    const collarCount = items.filter((item) => item.category === 'collar').length
    const accessoryCount = items.filter((item) => item.category === 'accesorio').length

    const hasDress = dressCount === 1 && topCount === 0 && bottomCount === 0
    const hasTopAndBottom = topCount === 1 && bottomCount === 1

    if (!hasDress && !hasTopAndBottom) {
      return false
    }

    if (shoeCount !== 1) {
      return false
    }

    if (bagCount > 1 || collarCount > 1 || accessoryCount > 1) {
      return false
    }

    return true
  }

  return true
}

function buildCombinations(style, items) {
  const pool = items.filter((item) => item.style === style)
  const results = []

  if (style === 'gothic') {
    const tops = pool.filter((item) => item.category === 'blusa')
    const bottoms = pool.filter((item) => item.category === 'falda')
    const shoes = pool.filter((item) => item.category === 'zapatos')
    const accessories = pool.filter((item) => ['guantes', 'accesorio'].includes(item.category))

    for (const blusa of tops) {
      for (const falda of bottoms) {
        for (const zapatos of shoes) {
          for (const accessory of accessories) {
            const outfit = [blusa, falda, zapatos, accessory]
            if (hasUniqueItems(outfit)) {
              results.push(outfit)
            }
          }
        }
      }
    }
  }

  if (style === 'vintage') {
    const tops = pool.filter((item) => item.category === 'blusa')
    const bottoms = pool.filter((item) => ['falda', 'pantalon', 'short'].includes(item.category))
    const dresses = pool.filter((item) => item.category === 'vestido')
    const bags = pool.filter((item) => item.category === 'bolso')
    const collars = pool.filter((item) => item.category === 'collar')
    const jackets = pool.filter((item) => item.category === 'chaqueta')
    const accessories = pool.filter((item) => item.category === 'accesorio')
    const bagOptions = [[]].concat(bags.map((item) => [item]))
    const collarOptions = [[]].concat(collars.map((item) => [item]))
    const jacketOptions = [[]].concat(jackets.map((item) => [item]))
    const accessoryOptions = [[]].concat(accessories.map((item) => [item]))

    for (const top of tops) {
      for (const bottom of bottoms) {
        for (const bagChoice of bagOptions) {
          for (const collarChoice of collarOptions) {
            for (const jacketChoice of jacketOptions) {
              for (const accessoryChoice of accessoryOptions) {
                const outfit = [top, bottom, ...bagChoice, ...collarChoice, ...jacketChoice, ...accessoryChoice]
                if (hasUniqueItems(outfit)) {
                  results.push(outfit)
                }
              }
            }
          }
        }
      }
    }

    for (const dress of dresses) {
      results.push([dress])
    }
  }

  if (style === 'oldMoney') {
    const tops = pool.filter((item) => item.category === 'blusa')
    const bottoms = pool.filter((item) => ['falda', 'pantalon', 'short'].includes(item.category))
    const dresses = pool.filter((item) => item.category === 'vestido')
    const shoes = pool.filter((item) => item.category === 'zapatos')
    const bags = pool.filter((item) => item.category === 'bolso')
    const collars = pool.filter((item) => item.category === 'collar')
    const accessories = pool.filter((item) => item.category === 'accesorio')
    const bagOptions = [[]].concat(bags.map((item) => [item]))
    const collarOptions = [[]].concat(collars.map((item) => [item]))
    const accessoryOptions = [[]].concat(accessories.map((item) => [item]))

    for (const top of tops) {
      for (const bottom of bottoms) {
        for (const shoe of shoes) {
          for (const bagChoice of bagOptions) {
            for (const collarChoice of collarOptions) {
              for (const accessoryChoice of accessoryOptions) {
                const outfit = [top, bottom, shoe, ...bagChoice, ...collarChoice, ...accessoryChoice]
                if (hasUniqueItems(outfit)) {
                  results.push(outfit)
                }
              }
            }
          }
        }
      }
    }

    for (const dress of dresses) {
      for (const shoe of shoes) {
        for (const bagChoice of bagOptions) {
          for (const collarChoice of collarOptions) {
            for (const accessoryChoice of accessoryOptions) {
              const outfit = [dress, shoe, ...bagChoice, ...collarChoice, ...accessoryChoice]
              if (hasUniqueItems(outfit)) {
                results.push(outfit)
              }
            }
          }
        }
      }
    }
  }

  if (style === 'baddie') {
    const tops = pool.filter((item) => item.category === 'blusa')
    const bottoms = pool.filter((item) => item.category === 'falda')
    const shoes = pool.filter((item) => item.category === 'zapatos')
    const medias = pool.filter((item) => item.category === 'medias')

    for (const blusa of tops) {
      for (const falda of bottoms) {
        for (const zapatos of shoes) {
          if (zapatos.id.toLowerCase().includes('zapatos2')) {
            const outfit = [blusa, falda, zapatos]
            if (hasUniqueItems(outfit)) results.push(outfit)
            continue
          }

          for (const media of medias) {
            const outfit = [blusa, falda, media, zapatos]
            if (hasUniqueItems(outfit)) results.push(outfit)
          }
        }
      }
    }
  }

  return results
}

export function generateOutfit(style) {
  const pool = getStylePool(style)
  const validOptions = buildCombinations(style, pool)
    .filter((items) => validateStyleRules(style, items))
    .map((items) => ({
      items,
      score: scoreOutfit(items, style),
      signature: createOutfitSignature(items),
    }))

  if (!validOptions.length) {
    return null
  }

  const selected = validOptions[Math.floor(Math.random() * validOptions.length)]

  return {
    style,
    items: selected.items,
    score: selected.score,
    signature: selected.signature,
  }
}

export function getPossibleOutfitCount(style) {
  const items = getStylePool(style)
  return buildCombinations(style, items).filter((combo) => validateStyleRules(style, combo)).length
}

export function canResetUsedOutfits(style) {
  const key = `move-used-${style}`
  const used = JSON.parse(localStorage.getItem(key) || '[]')
  return used.length >= getPossibleOutfitCount(style)
}

export function getUsedOutfitsKey(style) {
  return `move-used-${style}`
}

export function getOutfitId(items) {
  return createOutfitSignature(items)
}

export function getOutfitSummary(items) {
  return items.map((item) => item.name).join(' • ')
}

export function getRecommendedPalette(style) {
  return clothingCatalog[style]?.[0]?.colors || []
}

export const styleMeta = {
  gothic: { title: 'Gótico', description: 'Oscuro, elegante y expresivo.', emoji: '🖤' },
  vintage: { title: 'Romántico / Vintage', description: 'Romántico, delicado y nostálgico.', emoji: '💗' },
  oldMoney: { title: 'Old Money', description: 'Clásico, discreto y sofisticado.', emoji: '🤎' },
  baddie: { title: 'Baddie', description: 'Atrevido, urbano y glamoroso.', emoji: '🖤' },
}

export function isWearableOutfit(items) {
  return !!items && items.length > 0 && validateStyleRules(items[0]?.style || 'gothic', items)
}

export function getRandomStyleVariant(style) {
  const pool = getStylePool(style)
  const variants = buildCombinations(style, pool).filter((combo) => validateStyleRules(style, combo))
  return variants[Math.floor(Math.random() * variants.length)] || []
}

export function getStyleLabel(style) {
  return styleMeta[style]?.title || style
}

export function getStyleEmoji(style) {
  return styleMeta[style]?.emoji || '✨'
}

export const outfitRules = {
  gothic: {
    title: 'Gótico',
    summary: 'Blusa + falda + zapatos + 1 guante o 1 accesorio.',
  },
  vintage: {
    title: 'Romántico / Vintage',
    summary: 'Vestido solo o blusa + falda/pantalón; chaqueta opcional.',
  },
  oldMoney: {
    title: 'Old Money',
    summary: 'Zapatos obligatorios, bolso/collar opcionales y máximo 1 accesorio.',
  },
  baddie: {
    title: 'Baddie',
    summary: 'Blusa + falda + zapatos y, si aplica, medias.',
  },
}
