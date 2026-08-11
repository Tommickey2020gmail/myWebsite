---
title: ROS 2 学习整理
title_en: ROS 2 Study Notes
description: "为养老机器人体系（小暖大脑 / 小车移动 / 机械臂操作）打技术底座的一份 ROS 2 学习笔记：版本怎么选、核心概念、Nav2 / MoveIt 2 / ros2_control / micro-ROS 四条功能栈，以及一条按周推进的学习路线。"
description_en: "A ROS 2 study note laying the technical foundation for an eldercare robot stack (Xiaonuan the brain / a small rover / a manipulator): which distro to pick, the core concepts, the four functional stacks (Nav2, MoveIt 2, ros2_control, micro-ROS), and a week-by-week learning path."
lang: zh
tags: [robotics, ros2, navigation, embedded, learning-notes]
status: budding
created: 2026-08-10
audio: https://audio.tommickey.cn/ros2-study-notes.mp3?v=714f945b
cover: /illustrations/ros2-study-notes/cover.jpeg
---
![ROS 2 学习整理](/illustrations/ros2-study-notes/cover.jpeg)


> 整理日期：2026-08-10
> 面向目标：养老机器人体系（小暖大脑 / 小车移动 / 机械臂操作）的技术底座学习

## 一、ROS 2 是什么，为什么是它

ROS（Robot Operating System）不是操作系统，而是运行在 Linux 之上的**机器人中间件 + 工具链 + 生态**：它解决的核心问题是"一台机器人上几十个程序（感知、定位、规划、控制）如何解耦地互相通信、协同工作"。

ROS 2 是对 ROS 1 的彻底重写，关键变化：

- **通信层换成 DDS**（Data Distribution Service）：去掉了 ROS 1 的中心节点 roscore，分布式发现、无单点故障，支持 QoS 策略（可靠/尽力、历史深度、时效性），可用于多机、弱网、实时场景
- **面向产品级**：支持实时控制、嵌入式（micro-ROS）、多机器人、安全加密（SROS2）
- **ROS 1 已于 2025 年 5 月停止支持**（Noetic EOL），新项目没有悬念，直接 ROS 2

## 二、版本选择（2026 年 8 月现状）

![二、版本选择（2026 年 8 月现状）](/illustrations/ros2-study-notes/inline-1.jpeg)


ROS 2 每年 5 月 23 日发一版；偶数年为 LTS（支持 5 年），奇数年为普通版（支持 1.5 年）。每个版本只对应一个 Ubuntu LTS。

| 发行版 | 发布 | 支持到 | Ubuntu | 定位 |
|---|---|---|---|---|
| Humble Hawksbill | 2022.05 | 2027.05 | 22.04 | 上代 LTS，生态最成熟，大量教程基于它 |
| Jazzy Jalisco | 2024.05 | 2029.05 | 24.04 | **当前 LTS，新项目首选** |
| Kilted Kaiju | 2025.05 | 2026.11 | 24.04 | 普通版，即将 EOL，不建议入 |
| Lyrical Luth | 2026.05 | 2031.05 | 26.04 | **最新 LTS**（2026.05.22 发布，LTS-on-LTS 组合）|
| Rolling | 持续滚动 | — | — | 开发者预览，不用于学习/生产 |

**建议：学习期用 Ubuntu 24.04 + Jazzy。** 理由：Jazzy 生态已充分成熟（Nav2、MoveIt 2、micro-ROS、SLAM Toolbox 的二进制包和教程都齐），而 Lyrical Luth 虽是最新 LTS（支持到 2031），但发布仅两个多月，部分上层功能包和第三方教程尚未跟进，开发板对 Ubuntu 26.04 的支持也还在铺开。等项目进入长期开发阶段、且所依赖的包都已发布 Lyrical 版本时，再迁移更稳妥。若开发板/教程只支持 22.04，则用 Humble，概念完全通用。

## 三、核心概念（必须吃透的一层）

### 3.1 通信原语

- **Node（节点）**：一个功能单元一个节点（相机驱动、SLAM、电机控制各是一个）
- **Topic（话题）**：发布/订阅，单向流式数据（图像、激光、里程计），配 QoS 策略
- **Service（服务）**：请求/响应，一问一答（查询状态、触发一次动作）
- **Action（动作）**：带反馈、可取消的长任务（导航到某点、机械臂走一条轨迹）——Nav2 和 MoveIt 的对外接口基本都是 Action
- **Parameter（参数）**：节点的运行时配置，可动态改
- **消息接口**：`.msg` / `.srv` / `.action` 文件定义数据结构，跨语言（C++ rclcpp / Python rclpy）

### 3.2 运行机制

- **DDS/RMW**：底层通信实现可换（Humble/Jazzy 默认为 Fast DDS，常换 Cyclone DDS 解决发现/性能问题；新版本中 Zenoh 等新中间件也在进入官方支持，以所用发行版文档为准）
- **Executor 与回调**：单线程/多线程执行器，决定回调如何调度
- **Lifecycle Node（生命周期节点）**：configure→activate→deactivate 的受管状态机，产品级系统标配
- **Launch 系统**：Python 写的启动编排（ROS 1 是 XML），一条命令拉起整套节点并传参

### 3.3 机器人建模与坐标

- **tf2**：坐标变换树（map→odom→base_link→camera/gripper），整个机器人系统的"空间共识"，导航和抓取都靠它
- **URDF/Xacro**：机器人的连杆-关节描述文件，仿真、RViz 可视化、MoveIt 规划的输入

## 四、工具链

![四、工具链](/illustrations/ros2-study-notes/inline-2.jpeg)


- `ros2` CLI：`ros2 run / launch / topic echo / node list / bag record` —— 日常调试主力
- **colcon**：工作空间构建工具（对应 ROS 1 的 catkin）
- **RViz2**：3D 可视化（点云、tf、路径、模型）
- **rqt**：图形化调试插件集（节点图、话题监控、参数）
- **rosbag2**：数据录制回放——采数据、复现 bug 的利器
- **Gazebo**（新版，原 Ignition）：物理仿真；轻量替代还有 Webots

## 五、关键功能栈（与项目直接相关）

### 5.1 Nav2 —— 移动导航（对应：小车）

ROS 2 官方导航栈：定位（AMCL）+ 建图（配 SLAM Toolbox）+ 全局/局部路径规划 + 恢复行为，通过行为树编排，对外提供 `NavigateToPose` 等 Action。小车这条线的标准路径：**底盘发布里程计 + 激光/深度传感 → SLAM Toolbox 建图 → Nav2 自主导航**。

### 5.2 MoveIt 2 —— 机械臂运动规划（对应：SO-101）

运动学求解、碰撞检测、轨迹规划一站式框架。SO-101 社区已有 URDF/MoveIt 配置可参考。注意：LeRobot 的模仿学习流程本身**不依赖 ROS 2**（它直接读写舵机串口），但当机械臂要与小车、导航、感知组成一个系统时，ROS 2 是把它们接起来的总线。

参见 [[finding-hands-for-a-robot|给机器人找一双手]]。

### 5.3 ros2_control —— 硬件抽象与控制器

硬件接口（读编码器/写指令）与控制器（位置/速度/力矩、差速底盘 diff_drive）分离的实时控制框架。自制小车底盘接入 ROS 2 生态的标准做法就是写一个 ros2_control 的 hardware_interface。

### 5.4 micro-ROS —— 嵌入式端（对应：ESP32 小车）

把 ROS 2 节点跑到 MCU 上（**官方支持 ESP32**），通过串口/WiFi 与主机的 micro-ROS Agent 通信。ESP32-S3 小车可以用它直接以"一等公民"身份出现在 ROS 2 网络里，发布轮速、订阅速度指令。

## 六、学习路线（按周）

1. **第 1–2 周，通信基础**：装 Ubuntu 24.04 + Jazzy；用 turtlesim 玩熟 CLI；分别用 Python 和 C++ 写发布者/订阅者、服务、动作；理解 QoS 和 launch
2. **第 3 周，建模与仿真**：写一个简单差速小车的 URDF，在 RViz2 里看 tf 树，在 Gazebo 里跑起来
3. **第 4–5 周，导航线（优先，直接服务小车）**：SLAM Toolbox 仿真建图 → Nav2 仿真导航 → 理解代价地图与行为树参数
4. **第 6 周起，分叉**：
   - 小车实机：ESP32 上 micro-ROS 发里程计/收 `cmd_vel` → 底盘接入 ros2_control → 实机建图导航
   - 机械臂：SO-101 URDF → MoveIt 2 仿真规划 → 与 LeRobot 流程的边界与集成
5. **贯穿**：每做一步用 rosbag2 录数据、用 rqt/RViz2 复盘，养成"数据驱动调试"的习惯

## 七、资料清单

- 官方文档与教程（首选，按发行版分版）：<https://docs.ros.org/en/jazzy/>
- Nav2 文档：<https://docs.nav2.org/>
- MoveIt 2 文档：<https://moveit.picknik.ai/>
- ros2_control：<https://control.ros.org/>
- micro-ROS：<https://micro.ros.org/>
- SLAM Toolbox：<https://github.com/SteveMacenski/slam_toolbox>
- 中文社区：鱼香ROS（fishros，一键安装脚本和中文教程很好用）、古月居（系统性中文课程）、ROS 中文文档镜像（ros.ncnynl.com）
- 系统课程：官方 Tutorials（Beginner→Intermediate→Advanced 三级，最权威）、古月居《ROS 2 入门 21 讲》（中文视频入门）；纸质书更新常滞后于发行版，选购时认准覆盖 Humble/Jazzy 及以后的版本；进阶看官方 design 文档（design.ros2.org）理解 DDS 与架构取舍

## 八、常用命令速查

```bash
# 环境
source /opt/ros/jazzy/setup.bash

# 运行与启动
ros2 run <pkg> <node>
ros2 launch <pkg> <file>.launch.py

# 观察
ros2 node list / ros2 topic list
ros2 topic echo /scan
ros2 topic hz /odom
ros2 interface show geometry_msgs/msg/Twist

# 调试
ros2 param list / get / set
rqt_graph
ros2 bag record -a && ros2 bag play <bag>

# 构建
mkdir -p ~/ros2_ws/src && cd ~/ros2_ws
colcon build --symlink-install
source install/setup.bash
```

## 九、常见坑

- 忘记 `source` 环境或 workspace 的 `setup.bash`（现象：找不到包/节点）
- 多机通信不通：检查 `ROS_DOMAIN_ID` 是否一致、防火墙是否放行 DDS 组播；必要时换 Cyclone DDS
- QoS 不匹配（发布者 BEST_EFFORT、订阅者 RELIABLE）导致收不到数据，传感器话题尤其常见
- tf 树断链或时间戳不同步，导航/抓取直接失效——`ros2 run tf2_tools view_frames` 先看树
- 教程发行版与本机不一致导致 API 差异，查文档时先确认左上角的版本切换
