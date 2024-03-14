//utility function using promises

const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    } 
}


export {asyncHandler}





//higher order function(which accepts function within a function)
//const asyncHandler = () => {}
//const asyncHandler = (fn) => {() => {}}
//const asyncHandler = (fn) => () => {}  (remove curly braces)
//const asyncHandler = (fn) => async () => {} (makes it an async function)


//same utility function as above using async await

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }