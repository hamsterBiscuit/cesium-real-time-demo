import { ref } from 'vue'
import type { Ref } from 'vue'
import type { SceneDeploy, Entity } from './interface'

export function loadData<T>(url: string): Promise<T> {
  return fetch(url).then((response) => response.json())
}

export function useLoadData<T>(url: string): Ref<T | undefined> {
  const result = ref<T>()
  loadData<T>(url).then((json) => {
    result.value = json
  })
  return result
}

export const useLoadSceneDeply = (): Ref<SceneDeploy | undefined> => {
  return useLoadData('/json/sceneDeploy.json')
}

export const useLoadEntity = (): Ref<Entity | undefined> => {
  return useLoadData('/json/entity.json')
}
