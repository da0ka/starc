# starc
It is file (de)compression tool using Static Range Coder. You can set context order 0 to 2, counter bits 0 to 7, block size 0 to 16777215.
## improvement
Other implementation doesn't update model, but it does.
## options
* order --- context order. set 0-2.
* counter bits --- it for symbol counter. set 0-7. it means 1<<[value]+8.
* block size --- 0:16777216 bytes, 1-15:1<<[value]+9 bytes, 16-1023:[value]<<10 bytes, other:[value] bytes.
* update --- true:update static model. false:fixed model per block.
