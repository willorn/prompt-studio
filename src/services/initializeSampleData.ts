/**
 * 初始化示例数据服务
 * 为全新用户创建示例项目和版本
 */

import { db } from '@/db/schema';
import { projectManager } from './projectManager';
import { versionManager } from './versionManager';
import { storage, STORAGE_KEYS } from '@/utils/storage';

/**
 * 检查是否为全新用户（LocalStorage和IndexedDB都没有数据）
 */
async function isNewUser(): Promise<boolean> {
  // 检查是否首次打开
  const hasOpenedBefore = Object.values(STORAGE_KEYS).some(key => 
    storage.get(key, null) !== null
  );
  if (hasOpenedBefore) {
    return false; // 已经打开过
  }

  // 检查IndexedDB中是否有项目
  const projectCount = await db.projects.count();
  return projectCount === 0;
}

/**
 * 创建示例项目和版本
 * @returns 创建的项目ID
 */
async function createSampleProject(): Promise<string> {
  // 创建示例项目（无文件夹）
  const project = await projectManager.createProject('示例项目', null as any);
  
  // 创建根版本：小狗嬉戏
  const rootVersion = await versionManager.createVersion(
    project.id,
    '一只可爱的小狗在春意盎然的公园草地上嬉戏',
    null,
    undefined, // score
    '小狗嬉戏' // name
  );
  
  // 创建根分支1：帅气小狗
  await versionManager.createVersion(
    project.id,
    '一只威风凛凛帅气的德牧在春意盎然的公园草地上嬉戏',
    rootVersion.id,
    undefined, // score
    '帅气小狗' // name
  );

  // 创建根分支2：冬日小狗
  await versionManager.createVersion(
    project.id,
    '一只可爱的小狗在冬季白雪覆盖的公园草地上嬉戏',
    rootVersion.id,
    undefined, // score
    '冬日小狗' // name
  );

  return project.id;
}

/**
 * 初始化示例数据（如果是全新用户）
 * @returns 如果创建了示例项目，返回项目ID；否则返回null
 */
export async function initializeSampleData(): Promise<string | null> {
  try {
    if (await isNewUser()) {
      console.log('检测到全新用户，正在创建示例项目...');
      
      const projectId = await createSampleProject();
      console.log('示例项目创建完成');
      
      return projectId;
    }
    
    return null;
  } catch (error) {
    console.error('创建示例项目失败:', error);
    return null;
  }
}
