//vec1 Cartesian3    vec2 Cartesian3

function vec1ToVec2Mat(vec1, vec2) {
  //求旋转轴

  var axis = Cesium.Cartesian3.cross(vec1, vec2, new Cesium.Cartesian3(0, 0, 0))

  //求夹角

  var angle = Cesium.Math.acosClamped(
    Cesium.Cartesian3.dot(vec1, vec2) /
      (Cesium.Cartesian3.magnitude(vec1) * Cesium.Cartesian3.magnitude(vec2))
  )

  //求四元数

  var quaternion = Cesium.Quaternion.fromAxisAngle(
    axis,
    angle,
    new Cesium.Quaternion(0, 0, 0, 0)
  )

  //旋转矩阵

  var rotMat3 = Cesium.Matrix3.fromQuaternion(quaternion, new Cesium.Matrix3())

  return rotMat3
}

mat41 = Cesium.Transforms.eastNorthUpToFixedFrame(pos1)

var resQua = Cesium.Quaternion.clone(Cesium.Quaternion.IDENTITY)

var quaMatrix = Cesium.Matrix3.clone(Cesium.Matrix3.IDENTITY)

var roatMat3 = Cesium.Matrix3.clone(Cesium.Matrix3.IDENTITY)

var inveRoatMat3 = Cesium.Matrix3.clone(Cesium.Matrix3.IDENTITY)

var curAxis = new Cesium.Cartesian3(0, 0, 0)

roatMat3 = Cesium.Matrix4.getRotation(mat41, roatMat3)

var orientMat

var hpr

function computerOrient() {
  curAxis = Cesium.Cartesian3.subtract(pos2, pos1, curAxis)

  inveRoatMat3 = Cesium.Matrix3.inverse(roatMat3, inveRoatMat3)

  curAxis = Cesium.Matrix3.multiplyByVector(inveRoatMat3, curAxis, curAxis)

  orientMat = vec1ToVec2Mat(
    Cesium.Cartesian3.UNIT_X,

    Cesium.Cartesian3.normalize(curAxis, curAxis)
  )

  resQua = Cesium.Quaternion.fromRotationMatrix(orientMat, resQua)

  var tHpr = Cesium.HeadingPitchRoll.fromQuaternion(resQua, tHpr)

  hpr = [
    Cesium.Math.toDegrees(tHpr.heading),
    Cesium.Math.toDegrees(tHpr.pitch),

    Cesium.Math.toDegrees(tHpr.roll),
  ]
}

computerOrient()

model2.modelMatrix = Cesium.Matrix4.multiplyByMatrix3(
  model2.modelMatrix,
  orientMat,
  model2.modelMatrix
)
