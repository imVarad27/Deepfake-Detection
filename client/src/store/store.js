import { legacy_createStore as createStore, applyMiddleware } from "redux";
import authReducer from "../reducers/authReducer";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "secret",
  storage,
};

const persistedReducer = persistReducer(persistConfig, authReducer);

const store = createStore(persistedReducer, applyMiddleware());

const Persistor = persistStore(store);

export { Persistor };
export default store;
