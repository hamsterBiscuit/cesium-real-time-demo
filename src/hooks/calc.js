import * as Cesium from 'cesium'

/**
 * 计算a点和b点的角度（偏行角）
 * @param lng_a a点经度
 * @param lat_a a点维度
 * @param lng_b b点经度
 * @param lat_b b点维度
 * @returns 角度
 */
export function courseAngle(lng_a, lat_a, lng_b, lat_b) {
  //以a点为原点建立局部坐标系（东方向为x轴,北方向为y轴,垂直于地面为z轴），得到一个局部坐标到世界坐标转换的变换矩阵
  var localToWorld_Matrix = Cesium.Transforms.eastNorthUpToFixedFrame(
    new Cesium.Cartesian3.fromDegrees(lng_a, lat_a)
  )
  //求世界坐标到局部坐标的变换矩阵
  var worldToLocal_Matrix = Cesium.Matrix4.inverse(
    localToWorld_Matrix,
    new Cesium.Matrix4()
  )
  //a点在局部坐标的位置，其实就是局部坐标原点
  var localPosition_A = Cesium.Matrix4.multiplyByPoint(
    worldToLocal_Matrix,
    new Cesium.Cartesian3.fromDegrees(lng_a, lat_a),
    new Cesium.Cartesian3()
  )
  //B点在以A点为原点的局部的坐标位置
  var localPosition_B = Cesium.Matrix4.multiplyByPoint(
    worldToLocal_Matrix,
    new Cesium.Cartesian3.fromDegrees(lng_b, lat_b),
    new Cesium.Cartesian3()
  )
  //弧度
  var angle = Math.atan2(
    localPosition_B.y - localPosition_A.y,
    localPosition_B.x - localPosition_A.x
  )
  //角度
  var theta = angle * (180 / Math.PI)
  if (theta < 0) {
    theta = theta + 360
  }
  return theta
}

/**
 * 计算a点和b点的角度（俯仰角）
 * @param lng_a a点经度
 * @param lat_a a点维度
 * @param lng_b b点经度
 * @param lat_b b点维度
 * @returns 角度
 */
export function coursePitchAngle(lng_a, lat_a, alt_a, lng_b, lat_b, alt_b) {
  //以a点为原点建立局部坐标系（东方向为x轴,北方向为y轴,垂直于地面为z轴），得到一个局部坐标到世界坐标转换的变换矩阵
  var localToWorld_Matrix = Cesium.Transforms.eastNorthUpToFixedFrame(
    new Cesium.Cartesian3.fromDegrees(lng_a, lat_a, alt_a)
  )
  //求世界坐标到局部坐标的变换矩阵
  var worldToLocal_Matrix = Cesium.Matrix4.inverse(
    localToWorld_Matrix,
    new Cesium.Matrix4()
  )
  //a点在局部坐标的位置，其实就是局部坐标原点
  var localPosition_A = Cesium.Matrix4.multiplyByPoint(
    worldToLocal_Matrix,
    new Cesium.Cartesian3.fromDegrees(lng_a, lat_a, alt_a),
    new Cesium.Cartesian3()
  )
  //B点在以A点为原点的局部的坐标位置
  var localPosition_B = Cesium.Matrix4.multiplyByPoint(
    worldToLocal_Matrix,
    new Cesium.Cartesian3.fromDegrees(lng_b, lat_b, alt_b),
    new Cesium.Cartesian3()
  )
  //弧度
  var angle = Math.atan2(
    localPosition_B.z - localPosition_A.z,
    localPosition_B.x - localPosition_A.x
  )
  //角度
  var theta = angle * (180 / Math.PI)
  if (theta < 0) {
    theta = theta + 360
  }
  return theta
}

export const disTance = (positions1, positions2) => {
  var point1cartographic = Cesium.Cartographic.fromCartesian(positions1)
  var point2cartographic = Cesium.Cartographic.fromCartesian(positions2)
  /**根据经纬度计算出距离**/
  var geodesic = new Cesium.EllipsoidGeodesic()
  geodesic.setEndPoints(point1cartographic, point2cartographic)
  var s = geodesic.surfaceDistance
  //返回两点之间的距离
  //			s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
  // s = Math.abs(point2cartographic.height - point1cartographic.height)
  // distance = distance + s
  return s
}
