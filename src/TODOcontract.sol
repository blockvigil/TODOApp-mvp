pragma solidity ^0.5.10;
pragma experimental ABIEncoderV2;

contract TODOListContract {
    mapping(uint256 => TodoItem) private items;
    uint256 private itemCount;
    event TodoItemUpdated(uint256 itemId, bool updatedStatus);
    event TodoItemAdded(uint256 itemId, string note);
    event TodoItemRemoved(uint256 itemId);
    
    struct TodoItem {
        uint256 id;  // internal identifier
        string note;
        bool status;
    }
    
    constructor() public{
      itemCount = 0;    
    }
    
    function addTodo(string memory item) public {
        items[itemCount] = TodoItem(block.timestamp, item, false);
        emit TodoItemAdded(itemCount, item);
        itemCount += 1;
    }
    
    function toggleTodo(uint256 itemId) public {
        items[itemId].status = !items[itemId].status;
        emit TodoItemUpdated(itemId, items[itemId].status);
    }
    
    function removeTodo(uint256 itemId) public {
        items[itemId].note = 'Redacted';
        items[itemId].id = 0;
        items[itemId].status = false;
        emit TodoItemRemoved(itemId);
    }
    
    function getAllTodo() public view returns (TodoItem[] memory) {
        uint i;
        TodoItem[] memory todoItems = new TodoItem[](itemCount);
        for (i=0; i<itemCount; i++){
            todoItems[i] = items[i];
        }
        return todoItems;
    }
    
    function getTodoById(uint256 itemId) public view returns (TodoItem memory) {
        return items[itemId];
    }
}