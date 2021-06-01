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
