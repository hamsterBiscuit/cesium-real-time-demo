// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import * as Cesium from 'cesium'
;(window as any).CESIUM_BASE_URL = '/Cesium'

// Define the trajectory dynamic line texture of the line -->
function PolylineTrailLinkMaterialProperty(
  color: Cesium.Color,
  duration: number
): void {
  this._definitionChanged = new Cesium.Event()
  this._color = undefined
  this._colorSubscription = undefined
  this.color = color
  this.duration = duration
  this._time = new Date().getTime()
}
Object.defineProperties(PolylineTrailLinkMaterialProperty.prototype, {
  isConstant: {
    get: function () {
      return false
    },
  },
  definitionChanged: {
    get: function () {
      return this._definitionChanged
    },
  },
  color: Cesium.createPropertyDescriptor('color'),
})
PolylineTrailLinkMaterialProperty.prototype.getType = function () {
  return 'PolylineTrailLink'
}
PolylineTrailLinkMaterialProperty.prototype.getValue = function (
  time: Cesium.JulianDate,
  result: any
) {
  if (!Cesium.defined(result)) {
    result = {}
  }
  result.color = Cesium.Property.getValueOrClonedDefault(
    this._color,
    time,
    Cesium.Color.WHITE,
    result.color
  )
  result.image = Cesium.Material.PolylineTrailLinkImage
  result.time =
    ((new Date().getTime() - this._time) % this.duration) / this.duration
  return result
}
PolylineTrailLinkMaterialProperty.prototype.equals = function (other: any) {
  return (
    this === other ||
    (other instanceof PolylineTrailLinkMaterialProperty &&
      Cesium.Property.equals(this._color, other._color))
  )
}
// Mount the relevant flow line texture on Material, which can be encapsulated according to your needs
Cesium.Material.PolylineTrailLinkType = 'PolylineTrailLink'
Cesium.Material.PolylineTrailLinkImage = Cesium.buildModuleUrl('/img/line.jpg')
Cesium.Material.PolylineTrailLinkSource =
  'czm_material czm_getMaterial(czm_materialInput materialInput)\n\
  {\n\
        czm_material material = czm_getDefaultMaterial(materialInput);\n\
        vec2 st = materialInput.st;\n\
        vec4 colorImage = texture2D(image, vec2(fract(st.s - time), st.t));\n\
        material.alpha = colorImage.a * color.a;\n\
        material.diffuse = (colorImage.rgb+color.rgb)/2.0;\n\
        return material;\n\
    }'
Cesium.Material._materialCache.addMaterial(
  Cesium.Material.PolylineTrailLinkType,
  {
    fabric: {
      type: Cesium.Material.PolylineTrailLinkType,
      uniforms: {
        color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
        image: Cesium.Material.PolylineTrailLinkImage,
        time: 0,
      },
      source: Cesium.Material.PolylineTrailLinkSource,
    },
    translucent: function () {
      return true
    },
  }
)

export { PolylineTrailLinkMaterialProperty }
