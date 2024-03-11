//utility function using promises

import { Promise } from "mongoose"

const asynHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export {asynHandler}





//higher order function(which accepts function within a function)
//const asyncHandler = () => {}
//const asyncHandler = (fn) => {() => {}}
//const asyncHandler = (fn) => () => {}  (remove curly braces)
//const asyncHandler = (fn) => async () => {} (makes it an async function)


//same utility function as above using async await

// const asynHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }