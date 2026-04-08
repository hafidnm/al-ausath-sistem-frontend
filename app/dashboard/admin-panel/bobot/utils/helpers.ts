export const validateBobotTotal = (tugas: number, ulangan: number, ujianAkhir: number): boolean => {
  return tugas + ulangan + ujianAkhir === 100
}

export const calculatePercentage = (value: number, total: number = 100): string => {
  return `${((value / total) * 100).toFixed(1)}%`
}

export const formatBobot = (bobot: { tugas: number; ulangan: number; ujianAkhir: number }) => {
  return {
    ...bobot,
    total: bobot.tugas + bobot.ulangan + bobot.ujianAkhir,
  }
}
