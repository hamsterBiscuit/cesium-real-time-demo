// 根据两个点 开始角度、夹角度 求取立面的扇形
export function computeCirclularFlight(x1, y1, x2, y2, fx, angle) {
  let positionArr = []
  positionArr.push(x1)
  positionArr.push(y1)
  positionArr.push(0)

  var radius = Cesium.Cartesian3.distance(
    Cesium.Cartesian3.fromDegrees(x1, y1),
    Cesium.Cartesian3.fromDegrees(x2, y2)
  )

  for (let i = fx; i <= fx + angle; i++) {
    let h = radius * Math.sin((i * Math.PI) / 180.0)
    let r = Math.cos((i * Math.PI) / 180.0)

    let x = (x2 - x1) * r + x1
    let y = (y2 - y1) * r + y1

    positionArr.push(x)
    positionArr.push(y)
    positionArr.push(h)
  }

  return positionArr
}

// 根据第一个点 偏移距离 角度 求取第二个点的坐标
export function calcPoints(x1, y1, radius, heading) {
  var m = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(x1, y1)
  )

  var rx = radius * Math.cos((heading * Math.PI) / 180.0)
  var ry = radius * Math.sin((heading * Math.PI) / 180.0)

  var translation = Cesium.Cartesian3.fromElements(rx, ry, 0)

  var d = Cesium.Matrix4.multiplyByPoint(
    m,
    translation,
    new Cesium.Cartesian3()
  )

  var c = Cesium.Cartographic.fromCartesian(d)

  var x2 = Cesium.Math.toDegrees(c.longitude)
  var y2 = Cesium.Math.toDegrees(c.latitude)

  return computeCirclularFlight(x1, y1, x2, y2, 0, 90)
}

// var heading = 0;

// var positionArr = calcPoints(114, 30, 100, heading);

// var entity = viewer.entities.add({
//   wall: {
//     positions: new Cesium.CallbackProperty(() => { return Cesium.Cartesian3.fromDegreesArrayHeights(positionArr) }, false),
//     material: Cesium.Color.AQUAMARINE.withAlpha(0.5)
//   }
// });

// viewer.entities.add({
//   position: Cesium.Cartesian3.fromDegrees(114, 30),
//   ellipsoid: {
//     radii: new Cesium.Cartesian3(100, 100, 100),
//     maximumCone: Cesium.Math.toRadians(90),
//     material: Cesium.Color.AQUAMARINE.withAlpha(0.3),
//     outline: true,
//     outlineColor: Cesium.Color.AQUAMARINE.withAlpha(0.5),
//     outlineWidth: 1
//   }
// });

// viewer.zoomTo(viewer.entities);

// // 执行动画效果
// viewer.clock.onTick.addEventListener(() => {
//   heading += 0.1;
//   positionArr = calcPoints(114, 30, 100, heading);
// });
