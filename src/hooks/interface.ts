export interface SceneCommand {
  field: string
  command: string
  parameters: any
}

export interface Method {
  field: string
  command: string
  parameters: any
  unRealTime?: boolean
}

export interface BoundingSphere {
  center: number[]
}

export interface EventCommand {
  title: string
  description: string
  eventType: number
  showInList: boolean
  picture: string
  video: string
  currentTime: string
  duration: number
  position: number[]
  rotation: number[]
  method: Method[]
  boundingSphere: BoundingSphere
  headingPitchRange: number[]
}

export interface Parameters {
  url: string
  name: string
  format: string
  visible: boolean
  level: number
  type: string
  positions: number[][]
  maximumHeights: number[]
  minimumHeights: number[]
  fillElevation: number[]
  alpha?: number
  color: string[]
  fill?: boolean
}

export interface Method2 {
  field: string
  command: string
  parameters: number
}

export interface AddCommand {
  field: string
  id: string
  dataType: string
  parameters: Parameters
  method: Method2[]
}

export interface SceneDeploy {
  startTime: string
  endTime: string
  sceneCommands: SceneCommand[]
  eventCommands: EventCommand[]
  addCommands: AddCommand[]
}

export interface EffectList {
  id: string
  type: string
  destID: string
  positions: number[][]
  color: any
  alpha: number
  show?: boolean
  parabolaHeight?: number
  parabolaRadius?: number
  verticalLineCount?: number
  horizontalLineCount?: number
  scanningRate?: number
  scannerColor: string
  outlineColor: any
  offset: number[]
  lineColor: string
  visible?: boolean
  radarHeight?: number
  sphericalRadius?: number
  bottomRadius?: number
  sphericalSurfaceLineCount?: number
  planeSurfaceLineCount?: number
  maxAlpha?: number
  minAlpha?: number
  width?: number
  maxVerticeNum?: number
  radius?: number
}

export interface MobileList {
  id: string
  position: number[]
  objectType: string
  url: string
  image: string
  scale: number
  maximumScale: number
  imageScale: number
  effectList: EffectList[]
  modeloffsetHeading?: number
  path: string
  show?: boolean
  type?: number
}

export interface Entity {
  mobileList: MobileList[]
}
