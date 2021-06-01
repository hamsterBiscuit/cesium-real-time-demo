import { ref } from 'vue'
import type { Ref } from 'vue'
import type { SceneDeploy } from './interface'

export default (): Ref<SceneDeploy> => {
  const result = ref<SceneDeploy>()
  fetch('public/data/sceneDeploy.json')
    .then((response) => response.json())
    .then((json) => {
      result.value = json
    })
  return result
}
