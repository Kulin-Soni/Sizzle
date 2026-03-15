# Can be used in environments where onnxruntime is there.

import joblib
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType 

regressor = joblib.load("regressor.pkl")
initial_type = [('float_input', FloatTensorType([None, 384]))]
onnx_model = convert_sklearn(regressor, initial_types=initial_type)

with open("model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())