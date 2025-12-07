### **Shape Definition** - Keep it as data wrapper:

- constructor takes `(config, ShapeClass)`
- Stores both config.json data AND the shape class reference
- No need for complex instance creation - NodeView will call `ShapeClass.render()` direclty
- No BaseShape extension needed. No instance methods. Just a static `render()` function.
