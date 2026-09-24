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

function validateStyleRules(style, items) {
  const byCat = new Map(items.map((item) => [item.category, item]))

  if (style === 'gothic') {
    if (!byCat.get('blusa') || !byCat.get('falda') || !byCat.get('zapatos')) return false
    return Boolean(byCat.get('accesorio') || byCat.get('guantes'))
  }

  if (style === 'baddie') {
    if (!byCat.get('blusa') || !byCat.get('falda') || !byCat.get('zapatos')) return false
    if (byCat.get('zapatos')?.id?.toLowerCase().includes('zapatos2')) {
      return !byCat.get('medias')
    }
    return !!byCat.get('medias')
  }

  if (style === 'vintage') {
    const hasDress = !!byCat.get('vestido')
    const hasMain = !!byCat.get('blusa') && (!!byCat.get('falda') || !!byCat.get('pantalon') || !!byCat.get('short'))
    if (hasDress) {
      return !byCat.get('blusa') && !byCat.get('falda') && !byCat.get('pantalon') && !byCat.get('short')
    }
    return !!byCat.get('blusa') && (hasMain || !!byCat.get('vestido'))
  }

  if (style === 'oldMoney') {
    const shoeCount = items.filter((item) => item.category === 'zapatos').length
    const bagCount = items.filter((item) => item.category === 'bolso').length
    const collarCount = items.filter((item) => item.category === 'collar').length
    const hasDress = !!byCat.get('vestido')
    const hasBottom = !!byCat.get('falda') || !!byCat.get('pantalon') || !!byCat.get('short')

    if (!byCat.get('blusa') || shoeCount !== 1) return false
    if (bagCount > 1 || collarCount > 1) return false
    if (hasDress && hasBottom) return false
    if (!hasDress && !hasBottom) return false
    return true
  }

  return true
}

function buildCombinations(style, items) {
  const pool = items.filter((item) => item.style === style)
  const results = []

  if (style === 'gothic') {
    for (const blusa of pool.filter((item) => item.category === 'blusa')) {
      for (const falda of pool.filter((item) => item.category === 'falda')) {
        for (const zapatos of pool.filter((item) => item.category === 'zapatos')) {
          const accessories = pool.filter((item) => ['guantes', 'accesorio'].includes(item.category))
          for (const accessory of accessories) {
            const outfit = [blusa, falda, zapatos, accessory]
            if (new Set(outfit.map((item) => item.id)).size !== outfit.length) continue
            results.push(outfit)
          }
        }
      }
    }

    const extraAccessoryPool = pool.filter((item) => ['guantes', 'accesorio'].includes(item.category))
    for (const blusa of pool.filter((item) => item.category === 'blusa')) {
      for (const falda of pool.filter((item) => item.category === 'falda')) {
        for (const zapatos of pool.filter((item) => item.category === 'zapatos')) {
          for (const first of extraAccessoryPool) {
            for (const second of extraAccessoryPool) {
              if (first.id === second.id) continue
              const outfit = [blusa, falda, zapatos, first, second]
              if (new Set(outfit.map((item) => item.id)).size !== outfit.length) continue
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

    for (const top of tops) {
      for (const bottom of bottoms) {
        results.push([top, bottom])
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

    const optionalBagChoices = [[]].concat(bags.map((item) => [item]))
    const optionalCollarChoices = [[]].concat(collars.map((item) => [item]))
    const optionalAccessoryChoices = [[]]

    for (let count = 1; count <= Math.min(accessories.length, 3); count += 1) {
      for (const combo of combinationsOf(accessories, count)) {
        optionalAccessoryChoices.push(combo)
      }
    }

    for (const top of tops) {
      for (const bottom of bottoms) {
        for (const shoe of shoes) {
          const base = [top, bottom, shoe]
          for (const bagChoice of optionalBagChoices) {
            for (const collarChoice of optionalCollarChoices) {
              for (const accessoryChoice of optionalAccessoryChoices) {
                const outfit = [...base, ...bagChoice, ...collarChoice, ...accessoryChoice]
                if (new Set(outfit.map((item) => item.id)).size === outfit.length) {
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
        const base = [dress, shoe]
        for (const bagChoice of optionalBagChoices) {
          for (const collarChoice of optionalCollarChoices) {
            for (const accessoryChoice of optionalAccessoryChoices) {
              const outfit = [...base, ...bagChoice, ...collarChoice, ...accessoryChoice]
              if (new Set(outfit.map((item) => item.id)).size === outfit.length) {
                results.push(outfit)
              }
            }
          }
        }
      }
    }
  }

  if (style === 'baddie') {
    for (const blusa of pool.filter((item) => item.category === 'blusa')) {
      for (const falda of pool.filter((item) => item.category === 'falda')) {
        for (const zapatos of pool.filter((item) => item.category === 'zapatos')) {
          const medias = pool.filter((item) => item.category === 'medias')
          if (zapatos.id.toLowerCase().includes('zapatos2')) {
            results.push([blusa, falda, zapatos])
            continue
          }

          for (const media of medias) {
            results.push([blusa, falda, media, zapatos])
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
    .map((items) => {
      const score = scoreOutfit(items, style)
      const signature = createOutfitSignature(items)
      return {
        items,
        score,
        signature,
      }
    })

  if (!validOptions.length) {
    return null
  }

  const maxScore = Math.max(...validOptions.map((option) => option.score))
  const bestOptions = validOptions.filter((option) => option.score >= maxScore * 0.82)
  const selected = bestOptions[Math.floor(Math.random() * bestOptions.length)] || validOptions[Math.floor(Math.random() * validOptions.length)]

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

export const outfitRules = styleRules
