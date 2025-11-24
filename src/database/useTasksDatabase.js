import { useSQLiteContext } from 'expo-sqlite';

export function useTasksDatabase() {
  const database = useSQLiteContext();

  async function show() {
    const query = 'SELECT * FROM tasks ORDER BY create_date DESC';
    try {
      const response = await database.getAllAsync(query);
      return response.map(task => ({
        ...task,
        done: Boolean(task.done)
      }));
    } catch (error) {
      throw error;
    }
  }

  async function create(task) {
    const query = 'INSERT INTO tasks (title, description) VALUES (?, ?)';
    try {
      const result = await database.runAsync(query, [task.title, task.description]);
      const newTask = await database.getFirstAsync(
        'SELECT * FROM tasks WHERE id = ?',
        [result.lastInsertRowId]
      );
      return { ...newTask, done: Boolean(newTask.done) };
    } catch (error) {
      throw error;
    }
  }

  async function update(task) {
    const query = 'UPDATE tasks SET title = ?, description = ? WHERE id = ?';
    try {
      await database.runAsync(query, [task.title, task.description, task.id]);
      const updatedTask = await database.getFirstAsync(
        'SELECT * FROM tasks WHERE id = ?',
        [task.id]
      );
      return { ...updatedTask, done: Boolean(updatedTask.done) };
    } catch (error) {
      throw error;
    }
  }

  async function remove(id) {
    const query = 'DELETE FROM tasks WHERE id = ?';
    try {
      await database.runAsync(query, [id]);
    } catch (error) {
      throw error;
    }
  }

  async function updateStatus(id) {
    const query = 'UPDATE tasks SET done = NOT done WHERE id = ?';
    try {
      await database.runAsync(query, [id]);
      const updatedTask = await database.getFirstAsync(
        'SELECT * FROM tasks WHERE id = ?',
        [id]
      );
      return { ...updatedTask, done: Boolean(updatedTask.done) };
    } catch (error) {
      throw error;
    }
  }

  return { show, create, update, updateStatus, remove };
}
