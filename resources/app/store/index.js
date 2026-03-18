import { configureStore } from '@reduxjs/toolkit'
import ShopReducer from "./features/shops";
import ConfirmReducer from "./components/confirm";
import ToastReducer from "./components/toast";
import LoaderReducer from "./components/loader";

export default configureStore({
    reducer: {
        shopStore: ShopReducer,
        confirmStore: ConfirmReducer,
        toastStore: ToastReducer,
        loaderStore: LoaderReducer,
    }
})
