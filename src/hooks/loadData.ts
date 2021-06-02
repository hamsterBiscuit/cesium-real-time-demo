import { ref } from 'vue'
import type { Ref } from 'vue'
import type { SceneDeploy, Entity } from './interface'

function useLoadData<T>(url: string) {
  const result = ref<T>()
  fetch(url)
    .then((response) => response.json())
    .then((json) => {
      result.value = json
    })
  return result
}

export const useLoadSceneDeply = (): Ref<SceneDeploy> => {
  return useLoadData('public/json/sceneDeploy.json')
}

export const useLoadEntity = (): Ref<Entity> => {
  return useLoadData('public/json/entity.json')
}
